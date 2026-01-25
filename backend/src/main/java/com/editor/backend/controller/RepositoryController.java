package com.editor.backend.controller;

import com.editor.backend.dto.CloneRepositoryRequest;
import com.editor.backend.model.GitRepository;
import com.editor.backend.model.User;
import com.editor.backend.repository.GitRepositoryRepository;
import com.editor.backend.repository.UserRepository;
import com.editor.backend.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Optional;

@RestController
@RequestMapping("/api/repositories")
@RequiredArgsConstructor
@Slf4j
public class RepositoryController {

    private final GitService gitService;
    private final WorkspaceService workspaceService;
    private final GitRepositoryRepository gitRepoRepository;
    private final EncryptionService encryptionService;
    private final UserRepository userRepository;
    private final PipelineService pipelineService;
    private final TestStatsService testStatsService;

    @PostMapping("/clone")
    public ResponseEntity<String> cloneRepository(@RequestHeader("X-Username") String username,
                                                 @RequestBody CloneRepositoryRequest request) {
        try {
            // Sanitize URL: Remove embedded credentials (e.g., https://user@dev.azure.com -> https://dev.azure.com)
            String rawUrl = request.getRepositoryUrl();
            String sanitizedUrl = rawUrl;
            if (rawUrl.contains("@")) {
                // Keep protocol (https://) but drop everything up to the last @
                int protocolIndex = rawUrl.indexOf("://");
                int atIndex = rawUrl.lastIndexOf("@");
                if (protocolIndex != -1 && atIndex > protocolIndex) {
                    sanitizedUrl = rawUrl.substring(0, protocolIndex + 3) + rawUrl.substring(atIndex + 1);
                    log.info("Sanitized repository URL from {} to {}", rawUrl, sanitizedUrl);
                }
            }
            request.setRepositoryUrl(sanitizedUrl);

            String localPath = workspaceService.getRepoPath(username, request.getRepositoryUrl());
            File repoDir = new File(localPath);
            
            Optional<GitRepository> existing = gitRepoRepository.findByUsernameAndRepositoryUrl(username, request.getRepositoryUrl());
            
            if (repoDir.exists() && repoDir.isDirectory()) {
                File gitDir = new File(repoDir, ".git");
                if (gitDir.exists()) {
                    log.info("Repository folder already exists and contains .git. Skipping clone.");
                    // Ensure DB record exists
                    if (existing.isEmpty()) {
                        User user = userRepository.findByEmail(username)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                        GitRepository gitRepo = new GitRepository();
                        gitRepo.setUsername(username);
                        gitRepo.setRepositoryUrl(request.getRepositoryUrl());
                        gitRepo.setPersonalAccessToken(user.getGithubToken());
                        gitRepo.setLocalPath(localPath);
                        gitRepo.setAzureOrg(request.getAzureOrg());
                        gitRepo.setAzureProject(request.getAzureProject());
                        gitRepo.setAzurePipelineId(request.getAzurePipelineId());
                        gitRepoRepository.save(gitRepo);
                    }
                    return ResponseEntity.ok("Repository already exists and is reused.");
                } else {
                    log.warn("Folder exists but is not a git repository. Deleting to allow fresh clone: {}", localPath);
                    deleteDirectory(repoDir);
                }
            }

            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            String selectedTokenEncrypted = user.getGithubToken();
            if (request.getRepositoryUrl().contains("dev.azure.com") || request.getRepositoryUrl().contains("visualstudio.com")) {
                if (user.getAzurePat() != null && !user.getAzurePat().isEmpty()) {
                    selectedTokenEncrypted = user.getAzurePat();
                } else {
                    return ResponseEntity.badRequest().body("Azure DevOps PAT not found in settings. Please configure it in Settings -> CI/CD first.");
                }
            }

            String pat = encryptionService.decrypt(selectedTokenEncrypted);
            gitService.cloneRepository(request.getRepositoryUrl(), pat, localPath);

            GitRepository gitRepo = existing.orElse(new GitRepository());
            gitRepo.setUsername(username);
            gitRepo.setRepositoryUrl(request.getRepositoryUrl());
            gitRepo.setPersonalAccessToken(selectedTokenEncrypted);
            gitRepo.setLocalPath(localPath);
            gitRepo.setAzureOrg(request.getAzureOrg());
            gitRepo.setAzureProject(request.getAzureProject());
            gitRepo.setAzurePipelineId(request.getAzurePipelineId());
            gitRepoRepository.save(gitRepo);

            return ResponseEntity.ok("Repository cloned successfully.");
        } catch (Exception e) {
            log.error("Error cloning repository", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/reset")
    public ResponseEntity<String> resetRepository(@RequestHeader("X-Username") String username,
                                                  @RequestBody com.editor.backend.dto.ResetRequest request) {
        try {
            Optional<GitRepository> gitRepoOpt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, request.getRepoUrl());
            if (gitRepoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Repository not found for user");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();
            String pat = encryptionService.decrypt(gitRepo.getPersonalAccessToken());
            gitService.resetChanges(gitRepo.getLocalPath(), request.getFiles(), pat);
            
            return ResponseEntity.ok("Repository reset/undo successful");
        } catch (Exception e) {
            log.error("Error resetting repository", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncRepository(@RequestHeader("X-Username") String username,
                                                 @RequestParam String repoUrl) {
        try {
            Optional<GitRepository> gitRepoOpt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, repoUrl);
            if (gitRepoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Repository not found for user");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();
            
            // Critical: Always fetch the latest PAT from user settings to allow synchronization
            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            String latestPatEncrypted = repoUrl.contains("dev.azure.com") || repoUrl.contains("visualstudio.com")
                    ? user.getAzurePat()
                    : user.getGithubToken();
            
            if (latestPatEncrypted != null && !latestPatEncrypted.equals(gitRepo.getPersonalAccessToken())) {
                log.info("Updating repository PAT with latest from user settings for {}", repoUrl);
                gitRepo.setPersonalAccessToken(latestPatEncrypted);
                gitRepoRepository.save(gitRepo);
            }

            String pat = encryptionService.decrypt(gitRepo.getPersonalAccessToken());
            
            // 1. Sync Files from Git
            gitService.pullChanges(gitRepo.getLocalPath(), pat);
            
            // 2. Sync Execution Results from Azure DevOps (Telemetry)
            // This ensures "Performance Analysis" and "Stability Explorer" are updated immediately
            if (gitRepo.getAzurePipelineId() != null) {
                log.info("Triggering telemetry backfill for {} during sync", repoUrl);
                pipelineService.backfillRecentRuns(username, repoUrl, 20);
            }
            
            // 3. Record Test Case Trends
            testStatsService.recordTrends();
            
            return ResponseEntity.ok("Repository and telemetry synced with remote");
        } catch (Exception e) {
            log.error("Error syncing repository", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/current-branch")
    public ResponseEntity<String> getCurrentBranch(@RequestHeader("X-Username") String username,
                                                   @RequestParam String repoUrl) {
        try {
            Optional<GitRepository> gitRepoOpt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, repoUrl);
            if (gitRepoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Repository not found for user");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();
            String branch = gitService.getCurrentBranch(gitRepo.getLocalPath());
            
            return ResponseEntity.ok(branch);
        } catch (Exception e) {
            log.error("Error getting current branch", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/branches")
    public ResponseEntity<?> getAllBranches(@RequestHeader("X-Username") String username,
                                           @RequestParam String repoUrl) {
        try {
            Optional<GitRepository> gitRepoOpt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, repoUrl);
            if (gitRepoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Repository not found for user");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();

            // Refresh PAT from user record
            User user = userRepository.findByEmail(username).orElse(null);
            if (user != null) {
                String latestPat = repoUrl.contains("dev.azure.com") || repoUrl.contains("visualstudio.com")
                        ? user.getAzurePat() : user.getGithubToken();
                if (latestPat != null && !latestPat.equals(gitRepo.getPersonalAccessToken())) {
                    gitRepo.setPersonalAccessToken(latestPat);
                    gitRepoRepository.save(gitRepo);
                }
            }

            String pat = encryptionService.decrypt(gitRepo.getPersonalAccessToken());
            java.util.List<String> branches = gitService.getAllBranches(gitRepo.getLocalPath(), pat);
            
            return ResponseEntity.ok(branches);
        } catch (Exception e) {
            log.error("Error getting branches", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/create-branch")
    public ResponseEntity<String> createBranch(@RequestHeader("X-Username") String username,
                                              @RequestParam String repoUrl,
                                              @RequestParam String branchName,
                                              @RequestParam String baseBranch) {
        try {
            Optional<GitRepository> gitRepoOpt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, repoUrl);
            if (gitRepoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Repository not found for user");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();
            String createdBranch = gitService.createBranch(gitRepo.getLocalPath(), branchName, baseBranch);
            
            return ResponseEntity.ok(createdBranch);
        } catch (Exception e) {
            log.error("Error creating branch", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<java.util.List<GitRepository>> listRepositories(@RequestHeader("X-Username") String username) {
        try {
            return ResponseEntity.ok(gitRepoRepository.findByUsername(username));
        } catch (Exception e) {
            log.error("Error listing repositories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping
    public ResponseEntity<String> deleteRepository(@RequestHeader("X-Username") String username,
                                                 @RequestParam String repoUrl) {
        try {
            Optional<GitRepository> gitRepoOpt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, repoUrl);
            if (gitRepoOpt.isPresent()) {
                GitRepository repo = gitRepoOpt.get();
                // Clean up local files
                deleteDirectory(new File(repo.getLocalPath()));
                // Remove from DB
                gitRepoRepository.delete(repo);
                return ResponseEntity.ok("Repository metadata and local files deleted.");
            }
            return ResponseEntity.badRequest().body("Repository not found.");
        } catch (Exception e) {
            log.error("Error deleting repository", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/switch-branch")
    public ResponseEntity<String> switchBranch(@RequestHeader("X-Username") String username,
                                              @RequestParam String repoUrl,
                                              @RequestParam String branchName) {
        try {
            Optional<GitRepository> gitRepoOpt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, repoUrl);
            if (gitRepoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Repository not found for user");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();

            // Refresh PAT from user record
            User user = userRepository.findByEmail(username).orElse(null);
            if (user != null) {
                String latestPat = repoUrl.contains("dev.azure.com") || repoUrl.contains("visualstudio.com")
                        ? user.getAzurePat() : user.getGithubToken();
                if (latestPat != null && !latestPat.equals(gitRepo.getPersonalAccessToken())) {
                    gitRepo.setPersonalAccessToken(latestPat);
                    gitRepoRepository.save(gitRepo);
                }
            }

            String pat = encryptionService.decrypt(gitRepo.getPersonalAccessToken());
            gitService.switchBranch(gitRepo.getLocalPath(), branchName, pat);
            
            return ResponseEntity.ok(branchName);
        } catch (Exception e) {
            log.error("Error switching branch", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/settings")
    public ResponseEntity<String> updateRepositorySettings(@RequestHeader("X-Username") String username,
                                                         @RequestBody GitRepository settings) {
        try {
            Optional<GitRepository> repoOpt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, settings.getRepositoryUrl());
            if (repoOpt.isPresent()) {
                GitRepository repo = repoOpt.get();
                if (settings.getAzureOrg() != null) repo.setAzureOrg(settings.getAzureOrg());
                if (settings.getAzureProject() != null) repo.setAzureProject(settings.getAzureProject());
                if (settings.getAzurePipelineId() != null) repo.setAzurePipelineId(settings.getAzurePipelineId());
                gitRepoRepository.save(repo);
                return ResponseEntity.ok("Repository settings updated.");
            }
            return ResponseEntity.badRequest().body("Repository not found.");
        } catch (Exception e) {
            log.error("Error updating repo settings", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    private void deleteDirectory(File directory) {
        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                deleteDirectory(file);
            }
        }
        directory.delete();
    }
}
