package com.editor.backend.service;

import com.editor.backend.dto.StabilityStats;
import com.editor.backend.model.ScenarioResult;
import com.editor.backend.repository.ScenarioResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StabilityService {

    private final ScenarioResultRepository scenarioResultRepository;
    private final PipelineService pipelineService;

    private String normalizeRepoUrl(String url) {
        if (url == null) return null;
        String normalized = url.trim();
        if (normalized.endsWith("/")) normalized = normalized.substring(0, normalized.length() - 1);
        return normalized.toLowerCase();
    }

    public StabilityStats calculateStability(String repoUrl, String branch, String username) {
        String normalizedUrl = normalizeRepoUrl(repoUrl);
        List<ScenarioResult> results;
        if (branch != null && !branch.isEmpty()) {
            results = scenarioResultRepository.findByRepoUrlAndBranch(normalizedUrl, branch);
        } else {
            results = scenarioResultRepository.findByRepoUrl(normalizedUrl);
        }
        
        // AUTO-BACKFILL: If still empty, pull from Azure
        if (results.isEmpty()) {
            pipelineService.backfillRecentRuns(username, normalizedUrl, 20);
            results = scenarioResultRepository.findByRepoUrl(normalizedUrl);
        }

        if (results.isEmpty()) {
            return StabilityStats.builder()
                    .detectedBranch("None")
                    .featureStability(new ArrayList<>())
                    .flakyScenarios(new ArrayList<>())
                    .recentScenarios(new ArrayList<>())
                    .build();
        }

        String actualBranch = (branch != null && !branch.isEmpty()) ? branch : "Global Context";

        // Group by Scenario
        Map<String, List<ScenarioResult>> scenarioGroups = results.stream()
                .filter(r -> r.getScenarioName() != null)
                .collect(Collectors.groupingBy(ScenarioResult::getScenarioName));

        List<StabilityStats.ScenarioStability> scenarioMetrics = new ArrayList<>();
        for (Map.Entry<String, List<ScenarioResult>> entry : scenarioGroups.entrySet()) {
            List<ScenarioResult> scenarioResults = entry.getValue();
            
            // Dedup by runId to handle duplicate reporting from Azure Test Runs
            Map<Integer, ScenarioResult> uniqueRuns = new HashMap<>();
            for (ScenarioResult r : scenarioResults) {
                if (r.getRunId() == null) continue;
                ScenarioResult existing = uniqueRuns.get(r.getRunId());
                // Keep the one with the highest priority status or latest timestamp
                if (existing == null || (!"Passed".equalsIgnoreCase(existing.getStatus()) && "Passed".equalsIgnoreCase(r.getStatus()))) {
                    uniqueRuns.put(r.getRunId(), r);
                }
            }
            
            List<ScenarioResult> distinctResults = new ArrayList<>(uniqueRuns.values());
            distinctResults.sort(Comparator.comparing(ScenarioResult::getTimestamp).reversed());
            
            // Limit to last 10 executions for the Stability score
            List<ScenarioResult> recentResults = distinctResults.stream().limit(10).collect(Collectors.toList());
            long passed = recentResults.stream().filter(r -> "Passed".equalsIgnoreCase(r.getStatus())).count();
            double score = (passed * 100.0) / recentResults.size();
            
            scenarioMetrics.add(StabilityStats.ScenarioStability.builder()
                    .scenarioName(shortenName(entry.getKey()))
                    .featureName(shortenName(distinctResults.get(0).getFeatureFile()))
                    .stabilityScore(Math.round(score * 10.0) / 10.0)
                    .totalRuns(distinctResults.size())
                    .lastStatus(distinctResults.get(0).getStatus())
                    .trend(calculateTrend(recentResults))
                    .build());
        }

        // Sort by most recent execution overall
        scenarioMetrics.sort((a,b) -> {
            ScenarioResult resA = scenarioGroups.get(a.getScenarioName()).get(0);
            ScenarioResult resB = scenarioGroups.get(b.getScenarioName()).get(b.getTotalRuns() > 0 ? 0 : 0); // Both already sorted internal
            return resB.getTimestamp().compareTo(resA.getTimestamp());
        });

        // Group by Feature
        Map<String, List<StabilityStats.ScenarioStability>> featureGroups = scenarioMetrics.stream()
                .collect(Collectors.groupingBy(StabilityStats.ScenarioStability::getFeatureName));

        List<StabilityStats.FeatureStability> featureMetrics = new ArrayList<>();
        for (Map.Entry<String, List<StabilityStats.ScenarioStability>> entry : featureGroups.entrySet()) {
            List<StabilityStats.ScenarioStability> fbScenarios = entry.getValue();
            double avgScore = fbScenarios.stream().mapToDouble(StabilityStats.ScenarioStability::getStabilityScore).average().orElse(0);
            
            featureMetrics.add(StabilityStats.FeatureStability.builder()
                    .featureName(entry.getKey())
                    .stabilityScore(Math.round(avgScore * 10.0) / 10.0)
                    .totalRuns(fbScenarios.stream().mapToInt(StabilityStats.ScenarioStability::getTotalRuns).sum())
                    .lastStatus(fbScenarios.stream().anyMatch(s -> "Failed".equalsIgnoreCase(s.getLastStatus())) ? "Failed" : "Passed")
                    .build());
        }

        List<StabilityStats.ScenarioStability> flakyAll = scenarioMetrics.stream()
                .filter(s -> s.getStabilityScore() < 100)
                .sorted(Comparator.comparing(StabilityStats.ScenarioStability::getStabilityScore))
                .collect(Collectors.toList());


        // Calculate Execution History (Trend)
        Map<Integer, List<ScenarioResult>> runGroups = results.stream()
                .filter(r -> r.getRunId() != null && r.getScenarioName() != null)
                .collect(Collectors.groupingBy(ScenarioResult::getRunId));
        
        List<Integer> sortedRunIds = runGroups.keySet().stream().sorted().collect(Collectors.toList());
        List<StabilityStats.BuildMetric> history = new ArrayList<>();
        
        // Take last 10 builds to show a meaningful trend (aligned with Analytics Hub)
        int window = Math.max(0, sortedRunIds.size() - 10);
        for (int i = window; i < sortedRunIds.size(); i++) {
            Integer rId = sortedRunIds.get(i);
            List<ScenarioResult> rResults = runGroups.get(rId);
            
            Map<String, String> runScenarioMap = new HashMap<>();
            for (ScenarioResult r : rResults) {
                String existing = runScenarioMap.get(r.getScenarioName());
                if (existing == null || (!"Passed".equalsIgnoreCase(existing) && "Passed".equalsIgnoreCase(r.getStatus()))) {
                    runScenarioMap.put(r.getScenarioName(), r.getStatus());
                }
            }
            
            long passed = runScenarioMap.values().stream().filter(s -> "Passed".equalsIgnoreCase(s)).count();
            double passRate = (passed * 100.0) / runScenarioMap.size();
            history.add(StabilityStats.BuildMetric.builder()
                    .runId(rId)
                    .passRate(Math.round(passRate * 10.0) / 10.0)
                    .build());
        }
        double overallScore = history.isEmpty() ? 0.0 : history.stream()
                .mapToDouble(StabilityStats.BuildMetric::getPassRate)
                .average()
                .orElse(0.0);

        return StabilityStats.builder()
                .detectedBranch(actualBranch)
                .featureStability(featureMetrics.stream().sorted(Comparator.comparing(StabilityStats.FeatureStability::getStabilityScore)).collect(Collectors.toList()))
                .flakyScenarios(flakyAll.stream().limit(10).collect(Collectors.toList()))
                .totalFlakyScenarios(flakyAll.size())
                .recentScenarios(scenarioMetrics.stream()
                        .limit(10)
                        .collect(Collectors.toList()))
                .overallStabilityScore(Math.round(overallScore * 10.0) / 10.0)
                .executionHistory(history)
                .build();
    }

    public com.editor.backend.dto.PagedStabilityResponse getPaginatedStability(String repoUrl, String branch, int page, int size, String search, boolean flakyOnly) {
        String normalizedUrl = normalizeRepoUrl(repoUrl);
        List<ScenarioResult> results;
        if (branch != null && !branch.isEmpty()) {
            results = scenarioResultRepository.findByRepoUrlAndBranch(normalizedUrl, branch);
        } else {
            results = scenarioResultRepository.findByRepoUrl(normalizedUrl);
        }
        
        if (results.isEmpty()) {
            return com.editor.backend.dto.PagedStabilityResponse.builder()
                    .scenarios(new ArrayList<>())
                    .totalCount(0)
                    .totalPages(0)
                    .currentPage(page)
                    .pageSize(size)
                    .build();
        }

        // Group and calculate metrics (reusing logic but for ALL scenarios)
        Map<String, List<ScenarioResult>> scenarioGroups = results.stream()
                .filter(r -> r.getScenarioName() != null)
                .collect(Collectors.groupingBy(ScenarioResult::getScenarioName));

        List<StabilityStats.ScenarioStability> allMetrics = new ArrayList<>();
        for (Map.Entry<String, List<ScenarioResult>> entry : scenarioGroups.entrySet()) {
            List<ScenarioResult> scenarioResults = entry.getValue();
            
            // Dedup by runId
            Map<Integer, ScenarioResult> uniqueRuns = new HashMap<>();
            for (ScenarioResult r : scenarioResults) {
                if (r.getRunId() == null) continue;
                ScenarioResult existing = uniqueRuns.get(r.getRunId());
                if (existing == null || (!"Passed".equalsIgnoreCase(existing.getStatus()) && "Passed".equalsIgnoreCase(r.getStatus()))) {
                    uniqueRuns.put(r.getRunId(), r);
                }
            }
            
            List<ScenarioResult> distinctResults = new ArrayList<>(uniqueRuns.values());
            distinctResults.sort(Comparator.comparing(ScenarioResult::getTimestamp).reversed());
            
            // Limit to last 10 executions for the Stability score
            List<ScenarioResult> recentResults = distinctResults.stream().limit(10).collect(Collectors.toList());
            long passed = recentResults.stream().filter(r -> "Passed".equalsIgnoreCase(r.getStatus())).count();
            double score = (passed * 100.0) / recentResults.size();
            double roundedScore = Math.round(score * 10.0) / 10.0;

            // Apply flakyOnly filter
            if (flakyOnly && roundedScore >= 100.0) continue;

            // Filter by search if provided
            if (search != null && !search.isEmpty()) {
                boolean matches = entry.getKey().toLowerCase().contains(search.toLowerCase()) || 
                                 distinctResults.get(0).getFeatureFile().toLowerCase().contains(search.toLowerCase());
                if (!matches) continue;
            }

            allMetrics.add(StabilityStats.ScenarioStability.builder()
                    .scenarioName(shortenName(entry.getKey()))
                    .featureName(shortenName(distinctResults.get(0).getFeatureFile()))
                    .stabilityScore(roundedScore)
                    .totalRuns(distinctResults.size())
                    .lastStatus(distinctResults.get(0).getStatus())
                    .trend(calculateTrend(recentResults))
                    .build());
        }

        // Sort by stability score (lowest first to find problems) or most recent
        allMetrics.sort(Comparator.comparing(StabilityStats.ScenarioStability::getStabilityScore)
                .thenComparing((a,b) -> {
                    ScenarioResult resA = scenarioGroups.get(a.getScenarioName()).get(0);
                    ScenarioResult resB = scenarioGroups.get(b.getScenarioName()).get(0);
                    return resB.getTimestamp().compareTo(resA.getTimestamp());
                }));

        int totalCount = allMetrics.size();
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, totalCount);
        
        List<StabilityStats.ScenarioStability> pagedScenarios = (fromIndex < totalCount) 
                ? allMetrics.subList(fromIndex, toIndex) 
                : new ArrayList<>();

        return com.editor.backend.dto.PagedStabilityResponse.builder()
                .scenarios(pagedScenarios)
                .totalCount(totalCount)
                .totalPages((int) Math.ceil((double) totalCount / size))
                .currentPage(page)
                .pageSize(size)
                .build();
    }

    private String shortenName(String name) {
        if (name == null) return "Unknown";
        // Dynamic shortening: If it's a dot-qualified name, keep only the last two segments (e.g., Feature.Scenario)
        String[] parts = name.split("\\.");
        if (parts.length >= 2) {
            return parts[parts.length - 2] + "." + parts[parts.length - 1];
        }
        return name;
    }

    private String calculateTrend(List<ScenarioResult> results) {
        if (results.size() < 2) return "stable";
        
        // Check last 3 runs
        long recentFailures = results.stream().limit(3).filter(r -> "Failed".equalsIgnoreCase(r.getStatus())).count();
        if (recentFailures == 0) return "stable";
        if (recentFailures >= 2) return "unstable";
        return "improving";
    }

}
