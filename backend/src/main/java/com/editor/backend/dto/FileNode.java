package com.editor.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class FileNode {
    private String name;
    private String path;
    
    @JsonProperty("isDirectory")
    private boolean isDirectory;
    
    private List<FileNode> children;
    private String status;
}
