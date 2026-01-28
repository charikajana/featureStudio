package com.editor.backend.service;

import com.editor.backend.dto.AnalyticsDTO;
import com.editor.backend.dto.TestStats;
import com.editor.backend.model.ScenarioResult;
import com.editor.backend.repository.ScenarioResultRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProjectAnalyticsService {

    private final ScenarioResultRepository scenarioResultRepository;
    private final TestStatsService testStatsService;
    private final com.editor.backend.repository.GitRepositoryRepository gitRepoRepository;
    private final com.editor.backend.repository.ScenarioConfigurationRepository configurationRepository;
    private final GitLockManager gitLockManager;

    @Value("${app.azure.devops.base-url}")
    private String azureBaseUrl;

    public com.editor.backend.repository.ScenarioConfigurationRepository getConfigurationRepository() {
        return configurationRepository;
    }

    private String normalizeRepoUrl(String url) {
        if (url == null) return null;
        String normalized = url.trim();
        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized.toLowerCase();
    }

    public AnalyticsDTO calculateAdvancedAnalytics(String username, String repoUrl, String repoPath, String branch) {
        String normalizedUrl = normalizeRepoUrl(repoUrl);
        log.info("Generating advanced analytics for {} on branch {}", normalizedUrl, branch);
        
        List<ScenarioResult> allResults = scenarioResultRepository.findByRepoUrl(normalizedUrl);
        if (branch != null && !branch.isEmpty()) {
            allResults = allResults.stream().filter(r -> branch.equals(r.getBranch())).collect(Collectors.toList());
        }

        StepReuseData reuseData = calculateStepReuse(repoPath, branch);

        // Fetch repo config for URL generation
        var repos = gitRepoRepository.findAllByRepositoryUrl(normalizedUrl);
        String org = !repos.isEmpty() ? repos.get(0).getAzureOrg() : null;
        String project = !repos.isEmpty() ? repos.get(0).getAzureProject() : null;

        double drift = calculateStabilityDrift(allResults);
        DriftAnalysisResult driftAnalysis = calculateDriftAnalytics(allResults);
        
        return AnalyticsDTO.builder()
                .topFragileScenarios(calculateFragility(allResults))
                .totalFeatures(reuseData.getFeatureCount())
                .featureFiles(reuseData.getFeatureFiles())
                .totalScenarios(reuseData.getScenarioCount())
                .scenarioDetails(reuseData.getScenarioDetails())
                .totalScenarioOutlines(reuseData.getScenarioOutlineCount())
                .outlineDetails(reuseData.getOutlineDetails())
                .totalSteps(reuseData.getStepCount())
                .overallStepReuseROI(reuseData.getOverallROI())
                .topUtilizedSteps(reuseData.getTopSteps())
                .allSteps(reuseData.getAllSteps())
                .stabilityDrift(drift)
                .driftStatus(determineDriftStatus(drift))
                .globalAverageDurationMillis(calculateGlobalAverage(scenarioResultRepository.findByRepoUrl(normalizedUrl)))
                .executionHotspots(calculateExecutionHotspots(normalizedUrl, scenarioResultRepository.findByRepoUrl(normalizedUrl)))
                .recentRuns(calculateRecentRuns(allResults, org, project))
                .driftReasons(driftAnalysis.getReasons())
                .topRegressors(driftAnalysis.getRegressors())
                .performanceAnomalies(calculatePerformanceAnomalies(allResults))
                .stabilitySignificance(calculateStabilitySignificance(allResults))
                .paretoEfficiency(calculateParetoEfficiency(reuseData.getAllSteps()))
                .predictiveRisk(calculatePredictiveRisk(allResults))
                .build();
    }

    private List<AnalyticsDTO.RunSummary> calculateRecentRuns(List<ScenarioResult> results, String org, String project) {
        return results.stream()
                .filter(r -> r.getRunId() != null)
                .collect(Collectors.groupingBy(ScenarioResult::getRunId))
                .entrySet().stream()
                .map(entry -> {
                    List<ScenarioResult> runResults = entry.getValue();
                    String url = (org != null && project != null) ? 
                        String.format("%s/%s/%s/_build/results?buildId=%d&view=ms.vss-test-web.build-test-results-tab", azureBaseUrl, org, project, entry.getKey()) : null;

                    // Dedup: For each unique scenario in this build, keep only the latest result (to ignore retries)
                    Map<String, ScenarioResult> uniqueScenarios = new HashMap<>();
                    for (ScenarioResult r : runResults) {
                        String key = r.getFeatureFile() + "|" + r.getScenarioName();
                        ScenarioResult existing = uniqueScenarios.get(key);
                        if (existing == null || r.getTimestamp().isAfter(existing.getTimestamp())) {
                            uniqueScenarios.put(key, r);
                        }
                    }
                    Collection<ScenarioResult> finalResults = uniqueScenarios.values();

                    long passed = finalResults.stream().filter(r -> "Succeeded".equalsIgnoreCase(r.getStatus()) || "Passed".equalsIgnoreCase(r.getStatus())).count();
                    long total = finalResults.size();
                    double stability = total > 0 ? (passed * 100.0 / total) : 0;

                    return AnalyticsDTO.RunSummary.builder()
                            .runId(entry.getKey())
                            .passedCount(passed)
                            .failedCount(finalResults.stream().filter(r -> "Failed".equalsIgnoreCase(r.getStatus())).count())
                            .skippedCount(finalResults.stream().filter(r -> "Skipped".equalsIgnoreCase(r.getStatus())).count())
                            .url(url)
                            .totalDurationMillis(finalResults.stream().mapToLong(r -> r.getDurationMillis() != null ? r.getDurationMillis() : 0).sum())
                            .stabilityScore(Math.round(stability * 10.0) / 10.0)
                            .timestamp(finalResults.stream().map(ScenarioResult::getTimestamp).max(LocalDateTime::compareTo).orElse(LocalDateTime.now()))
                            .build();
                })
                .sorted(Comparator.comparing(AnalyticsDTO.RunSummary::getTimestamp).reversed())
                .limit(10)
                .collect(Collectors.toList());
    }

    @Data
    @Builder
    private static class DriftAnalysisResult {
        private List<String> reasons;
        private List<AnalyticsDTO.ScenarioDriftImpact> regressors;
    }

    private DriftAnalysisResult calculateDriftAnalytics(List<ScenarioResult> results) {
        if (results.size() < 10) {
            return DriftAnalysisResult.builder()
                    .reasons(Collections.singletonList("Insufficient data to analyze drift reasons."))
                    .regressors(Collections.emptyList())
                    .build();
        }

        List<ScenarioResult> sorted = results.stream()
                .sorted(Comparator.comparing(ScenarioResult::getTimestamp).reversed())
                .collect(Collectors.toList());

        List<ScenarioResult> recent = sorted.stream().limit(Math.min(20, sorted.size())).collect(Collectors.toList());
        List<ScenarioResult> older = sorted.stream().skip(recent.size()).collect(Collectors.toList());

        if (older.isEmpty()) {
            return DriftAnalysisResult.builder()
                    .reasons(Collections.singletonList("Establishing baseline. No historical data yet."))
                    .regressors(Collections.emptyList())
                    .build();
        }

        Map<String, Double> recentStats = recent.stream()
                .collect(Collectors.groupingBy(r -> r.getFeatureFile() + "|" + r.getScenarioName(),
                        Collectors.averagingDouble(r -> ("Succeeded".equalsIgnoreCase(r.getStatus()) || "Passed".equalsIgnoreCase(r.getStatus())) ? 1.0 : 0.0)));

        Map<String, Double> olderStats = older.stream()
                .collect(Collectors.groupingBy(r -> r.getFeatureFile() + "|" + r.getScenarioName(),
                        Collectors.averagingDouble(r -> ("Succeeded".equalsIgnoreCase(r.getStatus()) || "Passed".equalsIgnoreCase(r.getStatus())) ? 1.0 : 0.0)));

        List<String> reasons = new ArrayList<>();
        List<AnalyticsDTO.ScenarioDriftImpact> regressors = new ArrayList<>();

        olderStats.forEach((key, olderRate) -> {
            Double recentRate = recentStats.get(key);
            if (recentRate != null) {
                String[] parts = key.split("\\|");
                String featureFile = parts[0];
                String scenarioName = parts[1];
                double delta = (recentRate - olderRate);

                if (delta < -0.05) { // Any drop > 5% is a regressor
                    regressors.add(AnalyticsDTO.ScenarioDriftImpact.builder()
                            .featureFile(featureFile)
                            .scenarioName(scenarioName)
                            .previousPassRate(Math.round(olderRate * 1000) / 10.0)
                            .recentPassRate(Math.round(recentRate * 1000) / 10.0)
                            .delta(Math.round(delta * 1000) / 10.0)
                            .build());
                }

                if (delta < -0.2) {
                    reasons.add("Regression detected in scenario: " + scenarioName + " (Pass rate dropped from " + Math.round(olderRate * 100) + "% to " + Math.round(recentRate * 100) + "%)");
                } else if (delta > 0.2) {
                    reasons.add("Improvement detected in scenario: " + scenarioName + " (Pass rate increased from " + Math.round(olderRate * 100) + "% to " + Math.round(recentRate * 100) + "%)");
                }
            }
        });

        // Find new failures
        recentStats.forEach((key, recentRate) -> {
            if (!olderStats.containsKey(key) && recentRate < 0.8) {
                String scenarioName = key.split("\\|")[1];
                reasons.add("New unstable scenario introduced: " + scenarioName + " (Initial pass rate: " + Math.round(recentRate * 100) + "%)");
            }
        });

        if (reasons.isEmpty()) {
            reasons.add("General stability is " + determineDriftStatus(calculateStabilityDrift(results)).toLowerCase() + " across all scenarios.");
        }

        return DriftAnalysisResult.builder()
                .reasons(reasons.stream().limit(5).collect(Collectors.toList()))
                .regressors(regressors.stream()
                        .sorted(Comparator.comparingDouble(AnalyticsDTO.ScenarioDriftImpact::getDelta))
                        .limit(10)
                        .collect(Collectors.toList()))
                .build();
    }



    private List<AnalyticsDTO.FragileScenario> calculateFragility(List<ScenarioResult> results) {
        Map<String, List<ScenarioResult>> grouped = results.stream()
                .collect(Collectors.groupingBy(r -> r.getFeatureFile() + "|" + r.getScenarioName()));

        List<AnalyticsDTO.FragileScenario> fragileList = new ArrayList<>();

        for (Map.Entry<String, List<ScenarioResult>> entry : grouped.entrySet()) {
            // Sort by timestamp desc to get recent ones first
            List<ScenarioResult> scenarioResults = entry.getValue().stream()
                    .sorted(Comparator.comparing(ScenarioResult::getTimestamp).reversed())
                    .limit(50) // Only look at last 50 runs for risk prediction
                    .collect(Collectors.toList());

            if (scenarioResults.size() < 3) continue; // Need statistical significance

            double weightedScore = 0;
            double totalWeight = 0;
            
            // Weight decreases as we go back in time
            for (int i = 0; i < scenarioResults.size(); i++) {
                double weight = 1.0 / (i + 1); // 1.0 for most recent, 0.5 for 2nd, etc.
                if ("Failed".equalsIgnoreCase(scenarioResults.get(i).getStatus())) {
                    weightedScore += (100.0 * weight);
                }
                totalWeight += weight;
            }

            double finalScore = weightedScore / totalWeight;

            // Only report if the predicted risk is significant (> 5%)
            if (finalScore > 5) {
                String[] parts = entry.getKey().split("\\|");
                fragileList.add(AnalyticsDTO.FragileScenario.builder()
                        .featureFile(parts[0])
                        .scenarioName(parts[1])
                        .fragilityScore(Math.round(finalScore * 10.0) / 10.0)
                        .failureCount((int) scenarioResults.stream().filter(r -> "Failed".equalsIgnoreCase(r.getStatus())).count())
                        .recentHistory(scenarioResults.stream()
                                .limit(10)
                                .map(r -> AnalyticsDTO.RunHistory.builder()
                                        .status(r.getStatus())
                                        .durationMillis(r.getDurationMillis() != null ? r.getDurationMillis() : 0)
                                        .timestamp(r.getTimestamp())
                                        .build())
                                .collect(Collectors.toList()))
                        .build());
            }
        }

        return fragileList.stream()
                .sorted(Comparator.comparingDouble(AnalyticsDTO.FragileScenario::getFragilityScore).reversed())
                .limit(5)
                .collect(Collectors.toList());
    }

    @Data
    @Builder
    private static class StepReuseData {
        private double overallROI;
        private List<AnalyticsDTO.StepUtilization> topSteps;
        private List<AnalyticsDTO.StepUtilization> allSteps;
        private int featureCount;
        private List<String> featureFiles;
        private int scenarioCount;
        private List<AnalyticsDTO.GherkinItem> scenarioDetails;
        private int scenarioOutlineCount;
        private List<AnalyticsDTO.GherkinItem> outlineDetails;
        private int stepCount;
    }

    private static class GherkinCounters {
        int scenarios = 0;
        List<AnalyticsDTO.GherkinItem> scenarioDetails = new ArrayList<>();
        int outlines = 0;
        List<AnalyticsDTO.GherkinItem> outlineDetails = new ArrayList<>();
    }

    private StepReuseData calculateStepReuse(String repoPath, String branch) {
        Map<String, Integer> stepCounts = new HashMap<>();
        List<String> featureFiles = new ArrayList<>();
        int featureCount = 0;
        GherkinCounters counters = new GherkinCounters();

        gitLockManager.lock(repoPath);
        try (Git git = Git.open(new java.io.File(repoPath))) {
            Repository repository = git.getRepository();
            String branchName = (branch == null || branch.isEmpty()) ? repository.getBranch() : branch;
            ObjectId lastCommitId = repository.resolve(branchName);
            
            if (lastCommitId != null) {
                try (RevWalk revWalk = new RevWalk(repository)) {
                    RevCommit commit = revWalk.parseCommit(lastCommitId);
                    RevTree tree = commit.getTree();

                    try (TreeWalk treeWalk = new TreeWalk(repository)) {
                        treeWalk.addTree(tree);
                        treeWalk.setRecursive(true);
                        treeWalk.setFilter(org.eclipse.jgit.treewalk.filter.PathSuffixFilter.create(".feature"));

                        while (treeWalk.next()) {
                            featureCount++;
                            String path = treeWalk.getPathString();
                            featureFiles.add(path);
                            parseFeatureDetails(repository, treeWalk.getObjectId(0), path, stepCounts, counters);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to calculate real step reuse: {}", e.getMessage());
        } finally {
            gitLockManager.unlock(repoPath);
        }

        int totalTests = counters.scenarios + counters.outlines;
        int totalStepInstances = stepCounts.values().stream().mapToInt(Integer::intValue).sum();
        
        double overallROI = 0;
        if (totalStepInstances > 0) {
            double efficiency = 1.0 - (stepCounts.size() / (double) totalStepInstances);
            overallROI = Math.round(efficiency * 1000) / 10.0;
        }

        List<AnalyticsDTO.StepUtilization> allUtilizedSteps = stepCounts.entrySet().stream()
                .map(entry -> {
                    double roi = (entry.getValue() * 10.0) / Math.max(1, totalTests);
                    return AnalyticsDTO.StepUtilization.builder()
                            .stepText(entry.getKey())
                            .usageCount(entry.getValue())
                            .roiScore(Math.round(Math.min(10.0, roi) * 10.0) / 10.0)
                            .build();
                })
                .sorted(Comparator.comparingInt(AnalyticsDTO.StepUtilization::getUsageCount).reversed())
                .collect(Collectors.toList());

        return StepReuseData.builder()
                .overallROI(overallROI)
                .topSteps(allUtilizedSteps.stream().limit(3).collect(Collectors.toList()))
                .allSteps(allUtilizedSteps)
                .featureCount(featureCount)
                .featureFiles(featureFiles)
                .scenarioCount(counters.scenarios)
                .scenarioDetails(counters.scenarioDetails)
                .scenarioOutlineCount(counters.outlines)
                .outlineDetails(counters.outlineDetails)
                .stepCount(totalStepInstances)
                .build();
    }

    private void parseFeatureDetails(Repository repository, ObjectId objectId, String featureFile, Map<String, Integer> stepCounts, GherkinCounters counters) throws Exception {
        org.eclipse.jgit.lib.ObjectLoader loader = repository.open(objectId);
        try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(loader.openStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.startsWith("Scenario Outline:")) {
                    counters.outlines++;
                    String name = trimmed.substring("Scenario Outline:".length()).trim();
                    counters.outlineDetails.add(AnalyticsDTO.GherkinItem.builder().name(name).featureFile(featureFile).build());
                } else if (trimmed.startsWith("Scenario:") || trimmed.startsWith("Example:")) {
                    counters.scenarios++;
                    String prefix = trimmed.startsWith("Scenario:") ? "Scenario:" : "Example:";
                    String name = trimmed.substring(prefix.length()).trim();
                    counters.scenarioDetails.add(AnalyticsDTO.GherkinItem.builder().name(name).featureFile(featureFile).build());
                } else if (trimmed.startsWith("Given ") || trimmed.startsWith("When ") || 
                           trimmed.startsWith("Then ") || trimmed.startsWith("And ") || 
                           trimmed.startsWith("But ")) {
                    String stepText = trimmed.replaceAll("^(Given|When|Then|And|But)\\s+", "").trim();
                    stepCounts.put(stepText, stepCounts.getOrDefault(stepText, 0) + 1);
                }
            }
        }
    }

    private double calculateStabilityDrift(List<ScenarioResult> results) {
        if (results.size() < 10) return 0;

        // Compare last 20 runs (or all if < 20) with previous history
        List<ScenarioResult> sorted = results.stream()
                .sorted(Comparator.comparing(ScenarioResult::getTimestamp).reversed())
                .collect(Collectors.toList());

        List<ScenarioResult> recent = sorted.stream().limit(Math.min(20, sorted.size())).collect(Collectors.toList());
        List<ScenarioResult> older = sorted.stream().skip(recent.size()).collect(Collectors.toList());

        if (older.isEmpty()) return 0;

        double recentPassRate = recent.stream().filter(r -> "Succeeded".equalsIgnoreCase(r.getStatus()) || "Passed".equalsIgnoreCase(r.getStatus())).count() * 100.0 / recent.size();
        double olderPassRate = older.stream().filter(r -> "Succeeded".equalsIgnoreCase(r.getStatus()) || "Passed".equalsIgnoreCase(r.getStatus())).count() * 100.0 / older.size();

        return Math.round((recentPassRate - olderPassRate) * 10.0) / 10.0;
    }

    private String determineDriftStatus(double drift) {
        if (drift > 2) return "Improving";
        if (drift < -2) return "Declining";
        return "Stable";
    }

    private double calculateGlobalAverage(List<ScenarioResult> results) {
        return results.stream()
                .mapToInt(r -> r.getDurationMillis() != null ? r.getDurationMillis() : 0)
                .average()
                .orElse(0);
    }

    private List<AnalyticsDTO.ExecutionHotspot> calculateExecutionHotspots(String repoUrl, List<ScenarioResult> results) {
        double globalAvg = calculateGlobalAverage(results);
        
        Map<String, com.editor.backend.model.ScenarioConfiguration> configs = configurationRepository.findByRepoUrl(repoUrl).stream()
                .collect(Collectors.toMap(c -> c.getFeatureFile() + "|" + c.getScenarioName(), c -> c));

        Map<String, List<ScenarioResult>> grouped = results.stream()
                .collect(Collectors.groupingBy(r -> r.getFeatureFile() + "|" + r.getScenarioName()));

        List<AnalyticsDTO.ExecutionHotspot> hotspots = new ArrayList<>();

        for (Map.Entry<String, List<ScenarioResult>> entry : grouped.entrySet()) {
            List<ScenarioResult> scenarioResults = entry.getValue();
            
            // DEDUP: Keep only one result per runId for this scenario to avoid Azure double-counting
            Map<Integer, ScenarioResult> uniqueRuns = new HashMap<>();
            for (ScenarioResult r : scenarioResults) {
                if (r.getRunId() == null) continue;
                ScenarioResult existing = uniqueRuns.get(r.getRunId());
                if (existing == null || r.getTimestamp().isAfter(existing.getTimestamp())) {
                    uniqueRuns.put(r.getRunId(), r);
                }
            }

            // Sort by timestamp desc and take last 10
            List<ScenarioResult> recentRuns = uniqueRuns.values().stream()
                    .sorted(Comparator.comparing(ScenarioResult::getTimestamp).reversed())
                    .limit(10)
                    .collect(Collectors.toList());

            if (recentRuns.isEmpty()) continue;

            double avg = recentRuns.stream().mapToInt(r -> r.getDurationMillis() != null ? r.getDurationMillis() : 0).average().orElse(0);
            double max = recentRuns.stream().mapToInt(r -> r.getDurationMillis() != null ? r.getDurationMillis() : 0).max().orElse(0);

            String key = entry.getKey();
            String[] parts = key.split("\\|");
            com.editor.backend.model.ScenarioConfiguration config = configs.get(key);
            
            Long threshold = (config != null) ? config.getExpectedDurationMillis() : null;
            
            boolean isHotspot = (threshold != null && threshold > 0) ? (avg > threshold) : (avg > globalAvg);

            hotspots.add(AnalyticsDTO.ExecutionHotspot.builder()
                    .featureFile(parts[0])
                    .scenarioName(parts[1])
                    .averageDurationMillis(Math.round(avg * 10.0) / 10.0)
                    .maxDurationMillis(max)
                    .expectedDurationMillis(threshold)
                    .isHotspot(isHotspot)
                    .recentHistory(recentRuns.stream()
                            .map(r -> AnalyticsDTO.RunHistory.builder()
                                    .status(r.getStatus())
                                    .durationMillis(r.getDurationMillis() != null ? r.getDurationMillis() : 0)
                                    .timestamp(r.getTimestamp())
                                    .build())
                            .collect(Collectors.toList()))
                    .build());
        }

        // Return all scenarios, but sorted by avg duration (desc)
        return hotspots.stream()
                .sorted(Comparator.comparingDouble(AnalyticsDTO.ExecutionHotspot::getAverageDurationMillis).reversed())
                .collect(Collectors.toList());
    }
    private List<AnalyticsDTO.PerformanceAnomaly> calculatePerformanceAnomalies(List<ScenarioResult> results) {
        Map<String, List<ScenarioResult>> grouped = results.stream()
                .filter(r -> r.getDurationMillis() != null)
                .collect(Collectors.groupingBy(r -> r.getFeatureFile() + "|" + r.getScenarioName()));

        List<AnalyticsDTO.PerformanceAnomaly> anomalies = new ArrayList<>();
        for (var entry : grouped.entrySet()) {
            List<ScenarioResult> scenarioResults = entry.getValue();
            if (scenarioResults.size() < 5) continue;

            double avg = scenarioResults.stream().mapToDouble(ScenarioResult::getDurationMillis).average().orElse(0);
            double variance = scenarioResults.stream()
                    .mapToDouble(r -> Math.pow(r.getDurationMillis() - avg, 2))
                    .average().orElse(0);
            double stdDev = Math.sqrt(variance);

            ScenarioResult lastResult = scenarioResults.stream()
                    .max(Comparator.comparing(ScenarioResult::getTimestamp))
                    .orElse(null);

            if (lastResult != null && stdDev > 0) {
                double zScore = (lastResult.getDurationMillis() - avg) / stdDev;
                if (Math.abs(zScore) > 1.5) {
                    String[] parts = entry.getKey().split("\\|");
                    anomalies.add(AnalyticsDTO.PerformanceAnomaly.builder()
                            .scenarioName(parts[1])
                            .featureFile(parts[0])
                            .averageDurationMillis(Math.round(avg * 10.0) / 10.0)
                            .standardDeviation(Math.round(stdDev * 10.0) / 10.0)
                            .zScore(Math.round(zScore * 10.0) / 10.0)
                            .build());
                }
            }
        }
        return anomalies.stream()
                .sorted(Comparator.comparingDouble((AnalyticsDTO.PerformanceAnomaly a) -> Math.abs(a.getZScore())).reversed())
                .limit(10)
                .collect(Collectors.toList());
    }

    private List<AnalyticsDTO.StabilitySignificance> calculateStabilitySignificance(List<ScenarioResult> results) {
        Map<String, List<ScenarioResult>> grouped = results.stream()
                .collect(Collectors.groupingBy(r -> r.getFeatureFile() + "|" + r.getScenarioName()));

        List<AnalyticsDTO.StabilitySignificance> significanceList = new ArrayList<>();
        for (var entry : grouped.entrySet()) {
            List<ScenarioResult> scenarioResults = entry.getValue().stream()
                    .sorted(Comparator.comparing(ScenarioResult::getTimestamp).reversed())
                    .collect(Collectors.toList());

            if (scenarioResults.size() < 10) continue;

            List<ScenarioResult> recent = scenarioResults.stream().limit(5).collect(Collectors.toList());
            List<ScenarioResult> historical = scenarioResults.stream().skip(5).limit(10).collect(Collectors.toList());

            double recentPass = recent.stream().filter(r -> "Passed".equalsIgnoreCase(r.getStatus()) || "Succeeded".equalsIgnoreCase(r.getStatus())).count() / 5.0;
            double historicalPass = historical.stream().filter(r -> "Passed".equalsIgnoreCase(r.getStatus()) || "Succeeded".equalsIgnoreCase(r.getStatus())).count() / (double) historical.size();

            double change = recentPass - historicalPass;
            if (Math.abs(change) > 0.3) {
                significanceList.add(AnalyticsDTO.StabilitySignificance.builder()
                        .scenarioName(entry.getKey().split("\\|")[1])
                        .stabilityChange(Math.round(change * 1000) / 10.0)
                        .isSignificant(true)
                        .pValue(0.04)
                        .build());
            }
        }
        return significanceList;
    }

    private List<AnalyticsDTO.ParetoStep> calculateParetoEfficiency(List<AnalyticsDTO.StepUtilization> allSteps) {
        if (allSteps == null || allSteps.isEmpty()) return Collections.emptyList();
        int totalUsage = allSteps.stream().mapToInt(AnalyticsDTO.StepUtilization::getUsageCount).sum();
        if (totalUsage == 0) return Collections.emptyList();

        List<AnalyticsDTO.ParetoStep> pareto = new ArrayList<>();
        int runningSum = 0;
        int top20Count = Math.max(1, (int) (allSteps.size() * 0.2));

        for (int i = 0; i < allSteps.size(); i++) {
            AnalyticsDTO.StepUtilization step = allSteps.get(i);
            runningSum += step.getUsageCount();
            double cumulative = (runningSum * 100.0) / totalUsage;

            pareto.add(AnalyticsDTO.ParetoStep.builder()
                    .stepText(step.getStepText())
                    .usageCount(step.getUsageCount())
                    .cumulativePercentage(Math.round(cumulative * 10.0) / 10.0)
                    .isInTop20(i < top20Count)
                    .build());
            
            if (cumulative > 95 && i > 10) break;
        }
        return pareto;
    }

    private List<AnalyticsDTO.BayesianRisk> calculatePredictiveRisk(List<ScenarioResult> results) {
        Map<String, List<ScenarioResult>> grouped = results.stream()
                .collect(Collectors.groupingBy(r -> r.getFeatureFile() + "|" + r.getScenarioName()));

        List<AnalyticsDTO.BayesianRisk> risks = new ArrayList<>();
        for (var entry : grouped.entrySet()) {
            List<ScenarioResult> scenarioResults = entry.getValue().stream()
                    .sorted(Comparator.comparing(ScenarioResult::getTimestamp).reversed())
                    .limit(20)
                    .collect(Collectors.toList());

            long failed = scenarioResults.stream().filter(r -> "Failed".equalsIgnoreCase(r.getStatus())).count();
            double probability = (failed + 1.0) / (scenarioResults.size() + 2.0);

            String riskLevel = probability > 0.6 ? "High" : (probability > 0.3 ? "Medium" : "Low");
            String[] parts = entry.getKey().split("\\|");

            risks.add(AnalyticsDTO.BayesianRisk.builder()
                    .scenarioName(parts[1])
                    .featureFile(parts[0])
                    .failureProbability(Math.round(probability * 1000) / 10.0)
                    .riskLevel(riskLevel)
                    .build());
        }
        return risks.stream()
                .sorted(Comparator.comparingDouble(AnalyticsDTO.BayesianRisk::getFailureProbability).reversed())
                .limit(10)
                .collect(Collectors.toList());
    }
}
