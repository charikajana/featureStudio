package com.editor.backend.dto;

import lombok.Data;

@Data
public class TestStats {
    private int totalFeatures;
    private int totalScenarios;
    private int totalScenarioOutlines;
    private int totalTests;
    private int totalSteps;
}
