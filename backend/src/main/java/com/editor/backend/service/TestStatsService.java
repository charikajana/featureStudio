package com.editor.backend.service;

import com.editor.backend.dto.TestStats;
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

@Service
@Slf4j
public class TestStatsService {

    /**
     * Calculate test statistics for a repository.
     * Results are cached for 10 minutes to improve performance.
     * @param repoPath Path to the Git repository
     * @return TestStats containing counts of features, scenarios, steps, etc.
     */
    @Cacheable(value = "testStats", key = "{#repoPath, #branch}")
    public TestStats calculateStats(String repoPath, String branch) {
        log.info("Computing test stats for repository at path: {} on branch: {}", repoPath, branch);
        long startTime = System.currentTimeMillis();
        TestStats stats = new TestStats();
        
        File repoDir = new File(repoPath);
        if (!repoDir.exists()) {
            log.error("Repository directory does not exist: {}", repoPath);
            return stats;
        }

        try (Git git = Git.open(repoDir)) {
            Repository repository = git.getRepository();
            
            // 1. Identify branch: prioritize provided branch, then current checked out, then fallbacks
            String branchName = branch;
            if (branchName == null || branchName.isEmpty()) {
                branchName = repository.getBranch();
                log.info("No branch specified, using current checked out branch: {}", branchName);
            }
            
            log.info("Baseline branch for stats: {}", branchName);

            // 2. Resolve the branch to a tree
            ObjectId lastCommitId = repository.resolve(branchName);
            if (lastCommitId == null) {
                log.error("Could not resolve branch {} to a commit", branchName);
                return stats;
            }

            try (RevWalk revWalk = new RevWalk(repository)) {
                RevCommit commit = revWalk.parseCommit(lastCommitId);
                RevTree tree = commit.getTree();

                // 3. Walk the tree to find .feature files
                try (TreeWalk treeWalk = new TreeWalk(repository)) {
                    treeWalk.addTree(tree);
                    treeWalk.setRecursive(true);
                    treeWalk.setFilter(PathSuffixFilter.create(".feature"));

                    int fileCount = 0;
                    while (treeWalk.next()) {
                        fileCount++;
                        stats.setTotalFeatures(stats.getTotalFeatures() + 1);
                        parseFeatureFromTree(repository, treeWalk.getObjectId(0), stats);
                    }
                    log.info("Finished parsing {} feature files", fileCount);
                }
            }
            log.info("Stats calculation completed in {}ms", System.currentTimeMillis() - startTime);
        } catch (IOException e) {
            log.error("Error calculating test stats for repo {}: {}", repoPath, e.getMessage());
        }
        return stats;
    }

    private void parseFeatureFromTree(Repository repository, ObjectId objectId, TestStats stats) throws IOException {
        ObjectLoader loader = repository.open(objectId);
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(loader.openStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean inExamples = false;
            boolean headerSkipped = false;

            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }

                if (trimmed.startsWith("Scenario:") || trimmed.startsWith("Example:")) {
                    stats.setTotalScenarios(stats.getTotalScenarios() + 1);
                    stats.setTotalTests(stats.getTotalTests() + 1);
                    inExamples = false;
                } else if (trimmed.startsWith("Scenario Outline:") || trimmed.startsWith("Scenario Template:")) {
                    stats.setTotalScenarioOutlines(stats.getTotalScenarioOutlines() + 1);
                    inExamples = false;
                } else if (trimmed.startsWith("Examples:") || trimmed.startsWith("Scenarios:")) {
                    inExamples = true;
                    headerSkipped = false;
                } else if (trimmed.startsWith("Given ") || trimmed.startsWith("When ") || 
                           trimmed.startsWith("Then ") || trimmed.startsWith("And ") || 
                           trimmed.startsWith("But ")) {
                    stats.setTotalSteps(stats.getTotalSteps() + 1);
                } else if (inExamples && trimmed.startsWith("|")) {
                    if (!headerSkipped) {
                        headerSkipped = true;
                    } else {
                        stats.setTotalTests(stats.getTotalTests() + 1);
                    }
                } else if (inExamples && !trimmed.startsWith("|") && !trimmed.isEmpty()) {
                    inExamples = false;
                }
            }
        }
    }
}
