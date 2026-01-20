package com.editor.backend.dto;

import lombok.Data;

@Data
public class SettingsRequest {
    private String githubToken;
    private String azurePat;
    private String azureOrg;
    private String azureProject;
    private String azurePipelineId;
}
