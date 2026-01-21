package com.editor.backend.dto;

import lombok.Data;

@Data
public class TestStats {
    private int totalFeatures;
    private int totalScenarios;
    private int totalScenarioOutlines;
    private int totalTests;
    private int totalSteps;
    
    // Advanced Metrics for Project Managers & Leads
    private double readinessScore;       // 0-100 score based on coverage and best practices
    private double automationEfficiency; // Ratio of reusable steps
    private double stepReuseIndex;       // Measure of step reuse across scenarios
    private double coveragePercentage;   // Percentage of feature files with at least one scenario
    // Execution Metrics from latest pipeline run
    private int testsPassed;
    private int testsFailed;
    private int testsTotal;
    private double passRate;

    private int staleFeaturesCount;
}
