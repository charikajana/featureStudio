package com.editor.backend.service;

import com.editor.backend.dto.TestStats;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.treewalk.filter.PathSuffixFilter;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class TestStatsService {

    private final PipelineService pipelineService;

    @Cacheable(value = "testStats", key = "{#username, #repoUrl, #branch}")
    public TestStats calculateStats(String username, String repoUrl, String repoPath, String branch) {
        log.info("Computing quality scorecard for repository: {} on branch: {}", repoUrl, branch);
        long startTime = System.currentTimeMillis();
        TestStats stats = new TestStats();
        Set<String> uniqueSteps = new HashSet<>();
        int featuresWithScenarios = 0;
        
        File repoDir = new File(repoPath);
        if (!repoDir.exists()) return stats;

        // 1. Fetch Latest Execution Results from Pipeline
        try {
            java.util.List<java.util.Map<String, Object>> runs = pipelineService.listPipelineRuns(username, repoUrl, 1);
            if (runs != null && !runs.isEmpty()) {
                java.util.Map<String, Object> latestRun = runs.get(0);
                if (latestRun.get("testsTotal") != null) {
                    stats.setTestsPassed((int) latestRun.getOrDefault("testsPassed", 0));
                    stats.setTestsFailed((int) latestRun.getOrDefault("testsFailed", 0));
                    stats.setTestsTotal((int) latestRun.getOrDefault("testsTotal", 0));
                    stats.setPassRate(stats.getTestsTotal() > 0 ? (stats.getTestsPassed() * 100.0 / stats.getTestsTotal()) : 0);
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch execution metrics: {}", e.getMessage());
        }

        try (Git git = Git.open(repoDir)) {
            Repository repository = git.getRepository();
            String branchName = (branch == null || branch.isEmpty()) ? repository.getBranch() : branch;

            ObjectId lastCommitId = repository.resolve(branchName);
            if (lastCommitId == null) return stats;

            try (RevWalk revWalk = new RevWalk(repository)) {
                RevCommit commit = revWalk.parseCommit(lastCommitId);
                RevTree tree = commit.getTree();

                try (TreeWalk treeWalk = new TreeWalk(repository)) {
                    treeWalk.addTree(tree);
                    treeWalk.setRecursive(true);
                    treeWalk.setFilter(PathSuffixFilter.create(".feature"));

                    while (treeWalk.next()) {
                        stats.setTotalFeatures(stats.getTotalFeatures() + 1);
                        int scenariosInFile = parseFeatureFromTree(repository, treeWalk.getObjectId(0), stats, uniqueSteps);
                        if (scenariosInFile > 0) featuresWithScenarios++;
                    }
                }
            }

            // --- Advanced Calculations ---
            
            // 1. Coverage Percentage
            double coverage = (stats.getTotalFeatures() > 0) ? (featuresWithScenarios * 100.0 / stats.getTotalFeatures()) : 0;
            stats.setCoveragePercentage(Math.round(coverage * 10) / 10.0);

            // 2. Automation Efficiency (Reuse Index)
            // Higher unique steps relative to total steps means lower reuse. 
            // Efficiency = 1 - (unique/total). 100% means perfect reuse.
            if (stats.getTotalSteps() > 0) {
                double reuse = 1.0 - (uniqueSteps.size() / (double) stats.getTotalSteps());
                stats.setAutomationEfficiency(Math.round(reuse * 1000) / 10.0);
                stats.setStepReuseIndex(Math.round((stats.getTotalSteps() / (double) uniqueSteps.size()) * 10) / 10.0);
            }

            // 4. Readiness Score (EXECUTION FOCUSSED)
            // Go/No-Go based on Execution Results: 70% Execution Result + 20% Coverage + 10% Best Practices
            double executionScore = stats.getPassRate(); // 0-100
            
            // Best Practice Component (Complexity)
            double complexityPoints = 0;
            if (stats.getTotalTests() > 0) {
                double stepsPerTest = stats.getTotalSteps() / (double) stats.getTotalTests();
                if (stepsPerTest >= 3 && stepsPerTest <= 8) complexityPoints = 100;
                else if (stepsPerTest > 1) complexityPoints = 50;
            }

            double readiness;
            if (stats.getTestsTotal() > 0) {
                readiness = (executionScore * 0.7) + (coverage * 0.2) + (complexityPoints * 0.1);
            } else {
                // If no execution data, cap score at 40% (Not ready for release)
                readiness = (coverage * 0.3) + (complexityPoints * 0.1);
            }
            
            stats.setReadinessScore(Math.min(100, Math.round(readiness)));
            
            // 4. Stale Features (Simulated for Demo - in real world check commit dates)
            stats.setStaleFeaturesCount(Math.max(0, stats.getTotalFeatures() / 5)); 

            log.info("Stats calculation completed in {}ms. Score: {}", System.currentTimeMillis() - startTime, stats.getReadinessScore());
        } catch (IOException e) {
            log.error("Error calculating advanced stats: {}", e.getMessage());
        }
        return stats;
    }

    private int parseFeatureFromTree(Repository repository, ObjectId objectId, TestStats stats, Set<String> uniqueSteps) throws IOException {
        ObjectLoader loader = repository.open(objectId);
        int scenarioCount = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(loader.openStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean inExamples = false;
            boolean headerSkipped = false;

            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;

                if (trimmed.startsWith("Scenario:") || trimmed.startsWith("Example:")) {
                    stats.setTotalScenarios(stats.getTotalScenarios() + 1);
                    stats.setTotalTests(stats.getTotalTests() + 1);
                    scenarioCount++;
                    inExamples = false;
                } else if (trimmed.startsWith("Scenario Outline:") || trimmed.startsWith("Scenario Template:")) {
                    stats.setTotalScenarioOutlines(stats.getTotalScenarioOutlines() + 1);
                    scenarioCount++;
                    inExamples = false;
                } else if (trimmed.startsWith("Examples:") || trimmed.startsWith("Scenarios:")) {
                    inExamples = true;
                    headerSkipped = false;
                } else if (trimmed.startsWith("Given ") || trimmed.startsWith("When ") || 
                           trimmed.startsWith("Then ") || trimmed.startsWith("And ") || 
                           trimmed.startsWith("But ")) {
                    stats.setTotalSteps(stats.getTotalSteps() + 1);
                    // Standardize step for reuse tracking (remove keywords)
                    String stepText = trimmed.replaceAll("^(Given|When|Then|And|But)\\s+", "").trim();
                    uniqueSteps.add(stepText);
                } else if (inExamples && trimmed.startsWith("|")) {
                    if (!headerSkipped) headerSkipped = true;
                    else stats.setTotalTests(stats.getTotalTests() + 1);
                } else if (inExamples && !trimmed.startsWith("|") && !trimmed.isEmpty()) {
                    inExamples = false;
                }
            }
        }
        return scenarioCount;
    }
}
