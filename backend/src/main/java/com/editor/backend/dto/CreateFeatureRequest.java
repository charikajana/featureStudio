package com.editor.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateFeatureRequest {
    private String folderPath;
    private String featureName;
    private List<String> tags;
}
