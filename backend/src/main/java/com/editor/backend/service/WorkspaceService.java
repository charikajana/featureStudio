package com.editor.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@Slf4j
public class WorkspaceService {

    @Value("${app.workspace.root:/data/workspaces}")
    private String workspaceRoot;

    public String getUserWorkspacePath(String username) {
        Path path = Paths.get(workspaceRoot, username);
        try {
            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
        } catch (IOException e) {
            log.error("Failed to create workspace directory for user: {}", username, e);
            throw new RuntimeException("Could not initialize folder for user workspace", e);
        }
        return path.toAbsolutePath().toString();
    }

    public String getRepoPath(String username, String repoUrl) {
        String repoName = extractRepoName(repoUrl);
        return Paths.get(getUserWorkspacePath(username), repoName).toAbsolutePath().toString();
    }

    private String extractRepoName(String repoUrl) {
        if (repoUrl.endsWith(".git")) {
            repoUrl = repoUrl.substring(0, repoUrl.length() - 4);
        }
        return repoUrl.substring(repoUrl.lastIndexOf("/") + 1);
    }
}
