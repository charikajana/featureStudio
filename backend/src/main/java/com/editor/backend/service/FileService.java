package com.editor.backend.service;

import com.editor.backend.dto.FileNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class FileService {

    private static final List<String> IGNORED_DIRS = Arrays.asList(".git", "target", "node_modules", "build");

    public List<FileNode> getFeatureTree(String repoPath, org.eclipse.jgit.api.Status gitStatus) {
        File root = new File(repoPath);
        return scanForFeatures(root, root.getAbsolutePath(), gitStatus);
    }

    private List<FileNode> scanForFeatures(File directory, String rootPath, org.eclipse.jgit.api.Status gitStatus) {
        List<FileNode> nodes = new ArrayList<>();
        File[] files = directory.listFiles();

        if (files == null) return nodes;

        for (File file : files) {
            String name = file.getName();
            if (IGNORED_DIRS.contains(name)) continue;

            String relativePath = getRelativePath(file, rootPath);

            if (file.isDirectory()) {
                List<FileNode> children = scanForFeatures(file, rootPath, gitStatus);
                // Only add directory if it contains feature files or subdirectories with feature files
                if (!children.isEmpty()) {
                    nodes.add(FileNode.builder()
                            .name(name)
                            .path(relativePath)
                            .isDirectory(true)
                            .children(children)
                            .build());
                }
            } else if (name.endsWith(".feature")) {
                String status = null;
                if (gitStatus != null) {
                    if (gitStatus.getUntracked().contains(relativePath) || gitStatus.getAdded().contains(relativePath)) {
                        status = "new";
                    } else if (gitStatus.getModified().contains(relativePath) || gitStatus.getChanged().contains(relativePath)) {
                        status = "modified";
                    }
                }

                nodes.add(FileNode.builder()
                        .name(name)
                        .path(relativePath)
                        .isDirectory(false)
                        .status(status)
                        .build());
            }
        }
        return nodes;
    }

    private String getRelativePath(File file, String rootPath) {
        String path = file.getAbsolutePath().substring(rootPath.length()).replace("\\", "/");
        return path.startsWith("/") ? path.substring(1) : path;
    }

    public String readFile(String repoPath, String relativePath) throws IOException {
        Path path = Path.of(repoPath, relativePath);
        return Files.readString(path, StandardCharsets.UTF_8);
    }

    public void writeFile(String repoPath, String relativePath, String content) throws IOException {
        Path path = Path.of(repoPath, relativePath);
        if (path.getParent() != null && !Files.exists(path.getParent())) {
            Files.createDirectories(path.getParent());
        }
        Files.writeString(path, content, StandardCharsets.UTF_8);
    }
}
