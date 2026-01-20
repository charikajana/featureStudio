package com.editor.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class ResetRequest {
    private String repoUrl;
    private List<String> files;
}
