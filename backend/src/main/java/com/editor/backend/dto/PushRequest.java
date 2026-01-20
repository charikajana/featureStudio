package com.editor.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class PushRequest {
    private String commitMessage;
    private List<String> files;
}
