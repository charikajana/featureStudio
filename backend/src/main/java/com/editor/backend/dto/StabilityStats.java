package com.editor.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class StabilityStats {
    private String detectedBranch; // To inform the UI which branch data is shown
    private List<FeatureStability> featureStability;
    private List<ScenarioStability> flakyScenarios; 
    private List<ScenarioStability> recentScenarios; // Most recent 10 runs
    private int totalFlakyScenarios;
    private double overallStabilityScore;
    private List<BuildMetric> executionHistory; // Points for the trend graph
    
    @Data
    @Builder
    public static class BuildMetric {
        private Integer runId;
        private double passRate;
    }
    
    @Data
    @Builder
    public static class FeatureStability {
        private String featureName;
        private double stabilityScore; // 0-100
        private int totalRuns;
        private int passedRuns;
        private String lastStatus;
    }

    @Data
    @Builder
    public static class ScenarioStability {
        private String scenarioName;
        private String featureName;
        private double stabilityScore;
        private int totalRuns;
        private String lastStatus;
        private String trend; // "stable", "improving", "flaky"
    }
}
