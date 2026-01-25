package com.editor.backend.controller;

import com.editor.backend.dto.CreateFeatureRequest;
import com.editor.backend.dto.FileNode;
import com.editor.backend.dto.PushRequest;
import com.editor.backend.model.GitRepository;
import com.editor.backend.model.User;
import com.editor.backend.repository.GitRepositoryRepository;
import com.editor.backend.repository.UserRepository;
import com.editor.backend.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/features")
@RequiredArgsConstructor
@Slf4j
public class FeatureController {

    private final FileService fileService;
    private final WorkspaceService workspaceService;
    private final GitService gitService;
    private final GitRepositoryRepository gitRepoRepository;
    private final EncryptionService encryptionService;
    private final SuggestionService suggestionService;
    private final TestStatsService testStatsService;
    private final UserRepository userRepository;
    private final ProjectAnalyticsService analyticsService;

    @GetMapping("/suggestions")
    public ResponseEntity<java.util.Set<String>> getSuggestions(@RequestHeader("X-Username") String username,
                                                                 @RequestParam String repoUrl) {
        String repoPath = workspaceService.getRepoPath(username, repoUrl);
        return ResponseEntity.ok(suggestionService.discoverSteps(repoPath));
    }

    @GetMapping("/stats")
    public ResponseEntity<com.editor.backend.dto.TestStats> getTestStats(@RequestHeader("X-Username") String username,
                                                                         @RequestParam String repoUrl,
                                                                         @RequestParam(required = false) String branch) {
        String repoPath = workspaceService.getRepoPath(username, repoUrl);
        return ResponseEntity.ok(testStatsService.calculateStats(username, repoUrl, repoPath, branch));
    }

    @GetMapping("/trends")
    public ResponseEntity<List<com.editor.backend.model.TestCaseTrend>> getTrends(@RequestParam String repoUrl,

                                                                                 @RequestParam(defaultValue = "main") String branch) {
        return ResponseEntity.ok(testStatsService.getTrends(repoUrl, branch));
    }

    @GetMapping("/analytics")
    public ResponseEntity<com.editor.backend.dto.AnalyticsDTO> getAnalytics(@RequestHeader("X-Username") String username,
                                                                           @RequestParam String repoUrl,
                                                                           @RequestParam(required = false) String branch) {
        String repoPath = workspaceService.getRepoPath(username, repoUrl);
        return ResponseEntity.ok(analyticsService.calculateAdvancedAnalytics(username, repoUrl, repoPath, branch));
    }

    @PostMapping("/analytics/config")
    public ResponseEntity<Void> saveScenarioConfig(@RequestParam String repoUrl,
                                                   @RequestBody com.editor.backend.model.ScenarioConfiguration config) {
        config.setRepoUrl(repoUrl);
        // Find existing or update
        java.util.Optional<com.editor.backend.model.ScenarioConfiguration> existing = 
                analyticsService.getConfigurationRepository().findByRepoUrlAndFeatureFileAndScenarioName(
                        repoUrl, config.getFeatureFile(), config.getScenarioName());
        
        if (existing.isPresent()) {
            com.editor.backend.model.ScenarioConfiguration e = existing.get();
            e.setExpectedDurationMillis(config.getExpectedDurationMillis());
            analyticsService.getConfigurationRepository().save(e);
        } else {
            analyticsService.getConfigurationRepository().save(config);
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/tree")
    public ResponseEntity<List<FileNode>> getTree(@RequestHeader("X-Username") String username,
                                                  @RequestParam String repoUrl) {
        String repoPath = workspaceService.getRepoPath(username, repoUrl);
        org.eclipse.jgit.api.Status status = null;
        try {
            status = gitService.getStatus(repoPath);
        } catch (Exception e) {
            log.warn("Failed to get git status for {}: {}", repoPath, e.getMessage());
        }
        return ResponseEntity.ok(fileService.getFeatureTree(repoPath, status));
    }

    @GetMapping("/status")
    public ResponseEntity<java.util.Map<String, List<String>>> getStatus(@RequestHeader("X-Username") String username,
                                                                         @RequestParam String repoUrl) {
        String repoPath = workspaceService.getRepoPath(username, repoUrl);
        try {
            org.eclipse.jgit.api.Status status = gitService.getStatus(repoPath);
            java.util.Map<String, List<String>> result = new java.util.HashMap<>();
            
            List<String> modified = new java.util.ArrayList<>(status.getModified());
            modified.addAll(status.getChanged());
            
            List<String> untracked = new java.util.ArrayList<>(status.getUntracked());
            untracked.addAll(status.getAdded());
            
            result.put("modified", modified.stream().distinct().toList());
            result.put("untracked", untracked.stream().distinct().toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to get status", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping(value = "/content", produces = "text/plain")
    public ResponseEntity<String> getContent(@RequestHeader("X-Username") String username,
                                             @RequestParam String repoUrl,
                                             @RequestParam String path) throws IOException {
        String repoPath = workspaceService.getRepoPath(username, repoUrl);
        return ResponseEntity.ok(fileService.readFile(repoPath, path));
    }

    @PostMapping("/save")
    public ResponseEntity<Void> saveFile(@RequestHeader("X-Username") String username,
                                         @RequestParam String repoUrl,
                                         @RequestParam String path,
                                         @RequestBody String content) throws IOException {
        String repoPath = workspaceService.getRepoPath(username, repoUrl);
        fileService.writeFile(repoPath, path, content);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/create")
    public ResponseEntity<Void> createFeature(@RequestHeader("X-Username") String username,
                                              @RequestParam String repoUrl,
                                              @RequestBody CreateFeatureRequest request) throws IOException {
        log.info("Creating feature: {} with tags: {} in folder: {}", 
                 request.getFeatureName(), request.getTags(), request.getFolderPath());
        
        String repoPath = workspaceService.getRepoPath(username, repoUrl);
        
        // Handle filename vs display name
        String rawName = request.getFeatureName();
        String fileName = rawName;
        if (!fileName.toLowerCase().endsWith(".feature")) {
            fileName += ".feature";
        }
        
        String featureDisplayName = rawName;
        if (featureDisplayName.toLowerCase().endsWith(".feature")) {
            featureDisplayName = featureDisplayName.substring(0, featureDisplayName.length() - 8);
        }

        String relativePath = Path.of(request.getFolderPath(), fileName).toString();
        
        StringBuilder content = new StringBuilder();
        // Add tags at the top if present
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            content.append(String.join(" ", request.getTags())).append("\n");
        }
        
        content.append("Feature: ").append(featureDisplayName).append("\n\n");
        content.append("  Scenario: Verify ").append(featureDisplayName).append("\n");
        content.append("    Given some initial state\n");
        content.append("    When an action is performed\n");
        content.append("    Then a result is expected\n");

        fileService.writeFile(repoPath, relativePath, content.toString());
        log.info("Successfully created file: {}", relativePath);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/push")
    public ResponseEntity<String> pushChanges(@RequestHeader("X-Username") String username,
                                              @RequestParam String repoUrl,
                                              @RequestBody PushRequest request) {
        try {
            Optional<GitRepository> gitRepoOpt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, repoUrl);
            if (gitRepoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Repository not found for user");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();
            String localPath = gitRepo.getLocalPath();
            
            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            String selectedTokenEncrypted = gitRepo.getPersonalAccessToken();
            // Favor the latest global tokens if they are available
            if (repoUrl.contains("dev.azure.com") || repoUrl.contains("visualstudio.com")) {
                if (user.getAzurePat() != null && !user.getAzurePat().isEmpty()) {
                    selectedTokenEncrypted = user.getAzurePat();
                }
            } else if (repoUrl.contains("github.com")) {
                if (user.getGithubToken() != null && !user.getGithubToken().isEmpty()) {
                    selectedTokenEncrypted = user.getGithubToken();
                }
            }
            
            String pat = encryptionService.decrypt(selectedTokenEncrypted);
            
            if (pat == null || pat.isEmpty()) {
                return ResponseEntity.badRequest().body("Personal Access Token not configured. Please update in Settings -> Authentication.");
            }

            // Get current branch
            String currentBranch = gitService.getCurrentBranch(localPath);
            
            // Restriction: Prevent direct push to main/develop
            if ("main".equalsIgnoreCase(currentBranch) || "develop".equalsIgnoreCase(currentBranch)) {
                return ResponseEntity.status(403).body("⚠️ Direct push to '" + currentBranch + "' is restricted. Please create a feature branch and use a Pull Request to merge your changes.");
            }
            
            // Pull latest changes first (to avoid conflicts on push)
            gitService.pullChanges(localPath, pat);
            
            // Commit and push on current branch
            gitService.commitAndPush(localPath, pat, request.getCommitMessage(), currentBranch, request.getFiles());
            
            return ResponseEntity.ok(currentBranch);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace(); // Log the full stack trace
            return ResponseEntity.status(500).body("Push failed: " + e.getMessage());
        }
    }
}
