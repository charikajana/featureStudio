package com.editor.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AnalyticsDTO {
    // 1. Fragility Index (Predictive Flakiness)
    private List<FragileScenario> topFragileScenarios;
    private int totalFeatures;
    private List<String> featureFiles;
    private int totalScenarios;
    private List<GherkinItem> scenarioDetails;
    private int totalScenarioOutlines;
    private List<GherkinItem> outlineDetails;
    private int totalSteps;
    
    // 3. Step Utilization & ROI
    private double overallStepReuseROI;
    private List<StepUtilization> topUtilizedSteps;
    private List<StepUtilization> allSteps; // For deep dive
    
    // 4. Stability Drift (Regression Velocity)
    private double stabilityDrift; // Delta %
    private String driftStatus; // "Improving", "Declining", "Stable"
    
    // 5. Execution Hotspots (Performance)
    private double globalAverageDurationMillis;
    private List<ExecutionHotspot> executionHotspots;

    // Deep Dive Data
    private List<RunSummary> recentRuns;
    private List<String> driftReasons;
    private List<ScenarioDriftImpact> topRegressors;
    
    // Engineering Intelligence
    private List<PerformanceAnomaly> performanceAnomalies;
    private List<StabilitySignificance> stabilitySignificance;
    private List<ParetoStep> paretoEfficiency;
    private List<BayesianRisk> predictiveRisk;

    @Data
    @Builder
    public static class PerformanceAnomaly {
        private String scenarioName;
        private double averageDurationMillis;
        private double standardDeviation;
        private double zScore;
        private String featureFile;
    }

    @Data
    @Builder
    public static class StabilitySignificance {
        private String scenarioName;
        private double pValue;
        private boolean isSignificant; // Does this drop in stability matter?
        private double stabilityChange;
    }

    @Data
    @Builder
    public static class ParetoStep {
        private String stepText;
        private int usageCount;
        private double cumulativePercentage;
        private boolean isInTop20;
    }

    @Data
    @Builder
    public static class BayesianRisk {
        private String scenarioName;
        private double failureProbability; // 0.0 - 1.0
        private String riskLevel; // High, Medium, Low
        private String featureFile;
    }

    @Data
    @Builder
    public static class ScenarioDriftImpact {
        private String scenarioName;
        private String featureFile;
        private double previousPassRate;
        private double recentPassRate;
        private double delta;
    }


    @Data
    @Builder
    public static class FragileScenario {
        private String featureFile;
        private String scenarioName;
        private double fragilityScore; // 0-100
        private int failureCount;
        private List<RunHistory> recentHistory;
    }

    @Data
    @Builder
    public static class StepUtilization {
        private String stepText;
        private int usageCount;
        private double roiScore;
    }

    @Data
    @Builder
    public static class ExecutionHotspot {
        private String featureFile;
        private String scenarioName;
        private double averageDurationMillis;
        private double maxDurationMillis;
        private Long expectedDurationMillis; // User defined threshold
        private boolean isHotspot;
        private List<RunHistory> recentHistory;
    }

    @Data
    @Builder
    public static class RunHistory {
        private String status;
        private int durationMillis;
        private java.time.LocalDateTime timestamp;
    }

    @Data
    @Builder
    public static class GherkinItem {
        private String name;
        private String featureFile;
    }

    @Data
    @Builder
    public static class RunSummary {
        private Integer runId;
        private long passedCount;
        private long failedCount;
        private long skippedCount;
        private String url;
        private Long totalDurationMillis;
        private Double stabilityScore;
        private java.time.LocalDateTime timestamp;
    }
}
