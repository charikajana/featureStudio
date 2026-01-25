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

    @Data
    @Builder
    public static class FragileScenario {
        private String featureFile;
        private String scenarioName;
        private double fragilityScore; // 0-100
        private int failureCount;
        private int last10RunsStatus; // Bitmask or summary? Let's use summary
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
}
