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

    @org.springframework.beans.factory.annotation.Value("${app.workspace.root:workspaces}")
    private String workspaceRoot;

    public String getUserWorkspacePath(String username) {
        String root = workspaceRoot;
        
        // Normalize: If path contains /data/workspaces, it's the old/locked default. 
        // We override it to a local 'workspaces' folder unless the user explicitly 
        // provided a different writable absolute path.
        if (root == null || root.isEmpty()) {
            root = "workspaces";
            log.info("Using default workspace root: '{}'", root);
        }
        
        Path path;
        try {
            // If it's absolute, use it as is. If relative, resolve against current dir.
            Path rootPath = Paths.get(root);
            if (rootPath.isAbsolute()) {
                path = rootPath.resolve(username);
            } else {
                path = Paths.get(System.getProperty("user.dir")).resolve(root).resolve(username);
            }

            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
        } catch (Exception e) {
            log.warn("Invalid path configuration '{}', falling back to local 'workspaces'", root);
            path = Paths.get(System.getProperty("user.dir")).resolve("workspaces").resolve(username);
            try { Files.createDirectories(path); } catch (IOException ignore) {}
        }
            
        String finalPath = path.toAbsolutePath().toString();
        log.info("Workspace path resolved for {}: {}", username, finalPath);
        return finalPath;
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
