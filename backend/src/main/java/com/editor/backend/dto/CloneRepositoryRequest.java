package com.editor.backend.dto;

import lombok.Data;

@Data
public class CloneRepositoryRequest {
    private String repositoryUrl;
    private String personalAccessToken;
    private String azureOrg;
    private String azureProject;
    private String azurePipelineId;
}
