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
            String rawUrl = request.getRepositoryUrl();
            if (rawUrl == null) return ResponseEntity.badRequest().body("Repository URL is required.");
            
            String repoUrl = rawUrl.trim();
            if (repoUrl.contains("@")) {
                int protocolIndex = repoUrl.indexOf("://");
                int atIndex = repoUrl.lastIndexOf("@");
                if (protocolIndex != -1 && atIndex > protocolIndex) {
                    repoUrl = repoUrl.substring(0, protocolIndex + 3) + repoUrl.substring(atIndex + 1);
                    log.info("Sanitized repository URL for storage: {}", repoUrl);
                }
            }
            if (repoUrl.endsWith("/")) repoUrl = repoUrl.substring(0, repoUrl.length() - 1);
            request.setRepositoryUrl(repoUrl);

            String localPath = workspaceService.getRepoPath(username, repoUrl);
            File repoDir = new File(localPath);
            
            Optional<GitRepository> existing = findGitRepo(username, repoUrl);
            
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
                        
                        // Select correct token based on URL type
                        String initialToken = gitService.isAzureUrl(request.getRepositoryUrl()) 
                            ? user.getAzurePat() : user.getGithubToken();
                        gitRepo.setPersonalAccessToken(initialToken);
                        
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
            if (gitService.isAzureUrl(request.getRepositoryUrl())) {
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
            Optional<GitRepository> gitRepoOpt = findGitRepo(username, request.getRepoUrl());
            if (gitRepoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Repository not found for user");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();
            String pat = encryptionService.decrypt(gitRepo.getPersonalAccessToken());
            String localPath = workspaceService.getRepoPath(username, request.getRepoUrl());
            gitService.resetChanges(localPath, request.getFiles(), pat);
            
            return ResponseEntity.ok("Repository reset/undo successful");
        } catch (Exception e) {
            log.error("Error resetting repository", e);
            String msg = e.getMessage() != null ? e.getMessage() : "Unknown error";
            if (msg.contains("Permission denied") || msg.contains("Access is denied")) {
                msg = "Permission Denied. Close any open files/terminals in 'workspaces' folder and try again.";
            }
            return ResponseEntity.internalServerError().body("Error: " + msg);
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncRepository(@RequestHeader("X-Username") String username,
                                                 @RequestParam String repoUrl) {
        try {
            String normalizedUrl = repoUrl.trim();
            if (normalizedUrl.endsWith("/")) normalizedUrl = normalizedUrl.substring(0, normalizedUrl.length() - 1);
            
            // Try looking up with both the original and potentially normalized URL
            Optional<GitRepository> gitRepoOpt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, repoUrl);
            if (gitRepoOpt.isEmpty()) {
                gitRepoOpt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, normalizedUrl);
            }
            if (gitRepoOpt.isEmpty()) {
                gitRepoOpt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, normalizedUrl + ".git");
            }
            
            if (gitRepoOpt.isEmpty()) {
                log.warn("Sync failed. Looked for '{}' in DB for user '{}', but no record found.", repoUrl, username);
                
                // Diagnostic: Log all repos for this user to help see if there's a typo
                java.util.List<GitRepository> allUserRepos = gitRepoRepository.findByUsername(username);
                log.info("User '{}' has {} repositories registered.", username, allUserRepos.size());
                for (GitRepository r : allUserRepos) {
                    log.info(" - Registered URL: {}", r.getRepositoryUrl());
                }

                return ResponseEntity.badRequest().body("Repository not found in backend database. " +
                    "Since you re-cloned the project, you must re-register this repository. " +
                    "Go to the 'Workspace' tab and click 'Clone' for this repository again.");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();
            
            // Critical: Always fetch the latest PAT from user settings to allow synchronization
            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            String latestPatEncrypted = gitService.isAzureUrl(normalizedUrl)
                    ? user.getAzurePat()
                    : user.getGithubToken();
            
            if (latestPatEncrypted == null || latestPatEncrypted.isEmpty()) {
                log.warn("No PAT found in user settings for {} during sync", username);
                return ResponseEntity.badRequest().body("Please configure your Azure DevOps PAT in Settings -> Authentication first.");
            }

            if (!latestPatEncrypted.equals(gitRepo.getPersonalAccessToken())) {
                log.info("Updating repository record with latest PAT for {}", normalizedUrl);
                gitRepo.setPersonalAccessToken(latestPatEncrypted);
                gitRepoRepository.save(gitRepo);
            }

            String pat = encryptionService.decrypt(gitRepo.getPersonalAccessToken());
            
            if (pat == null || pat.isEmpty()) {
                return ResponseEntity.badRequest().body("Personal Access Token not configured. Please update in Settings -> Authentication.");
            }
            
            // Normalize path for Windows compatibility and to bypass stale database paths
            String localPath = workspaceService.getRepoPath(username, repoUrl);
            
            // 1. Sync Files from Git
            gitService.pullChanges(localPath, pat);
            
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
            String msg = e.getMessage() != null ? e.getMessage() : "Unknown error";
            
            // Check for OS/Filesystem level permissions vs Git/Auth permissions
            String localPath = workspaceService.getRepoPath(username, repoUrl);
            File repoDir = new File(localPath);
            
            if (!repoDir.exists()) {
                msg = "Project folder missing. Please try Re-cloning from the Workspace tab.";
            } else if (msg.contains("Permission denied") || msg.contains("Access is denied") || msg.contains("could not lock") || msg.contains(".lock")) {
                msg = "Git operation blocked. This could be a local file lock (close open terminals, IDEs, or VS Code) OR your Azure PAT lacks 'Code (Read & Write)' permissions.";
            } else if (msg.contains("not authorized") || msg.contains("401") || msg.contains("Auth fail")) {
                msg = "Authentication failed (401). Your Azure PAT may be invalid or expired. Please update it in Settings -> Authentication.";
            }
            
            return ResponseEntity.internalServerError().body("Error: " + msg);
        }
    }

    @GetMapping("/current-branch")
    public ResponseEntity<String> getCurrentBranch(@RequestHeader("X-Username") String username,
                                                   @RequestParam String repoUrl) {
        try {
            Optional<GitRepository> gitRepoOpt = findGitRepo(username, repoUrl);
            if (gitRepoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Repository not found for user");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();
            String localPath = workspaceService.getRepoPath(username, repoUrl);
            String branch = gitService.getCurrentBranch(localPath);
            
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
            Optional<GitRepository> gitRepoOpt = findGitRepo(username, repoUrl);
            if (gitRepoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Repository not found for user");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();

            // Refresh PAT from user record
            User user = userRepository.findByEmail(username).orElse(null);
            if (user != null) {
                String latestPat = gitService.isAzureUrl(repoUrl)
                        ? user.getAzurePat() : user.getGithubToken();
                if (latestPat != null && !latestPat.equals(gitRepo.getPersonalAccessToken())) {
                    gitRepo.setPersonalAccessToken(latestPat);
                    gitRepoRepository.save(gitRepo);
                }
            }

            String pat = encryptionService.decrypt(gitRepo.getPersonalAccessToken());
            String localPath = workspaceService.getRepoPath(username, repoUrl);
            java.util.List<String> branches = gitService.getAllBranches(localPath, pat);
            
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
            Optional<GitRepository> gitRepoOpt = findGitRepo(username, repoUrl);
            if (gitRepoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Repository not found for user");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();
            String localPath = workspaceService.getRepoPath(username, repoUrl);
            String createdBranch = gitService.createBranch(localPath, branchName, baseBranch);
            
            return ResponseEntity.ok(createdBranch);
        } catch (Exception e) {
            log.error("Error creating branch", e);
            String msg = e.getMessage() != null ? e.getMessage() : "Unknown error";
            if (msg.contains(".lock")) {
                msg = "Git is busy or a stale lock exists (index.lock). I have attempted to clean it, please try again.";
            }
            return ResponseEntity.internalServerError().body("Error: " + msg);
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
                String localPath = workspaceService.getRepoPath(username, repoUrl);
                deleteDirectory(new File(localPath));
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
            Optional<GitRepository> gitRepoOpt = findGitRepo(username, repoUrl);
            if (gitRepoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Repository not found for user");
            }
            
            GitRepository gitRepo = gitRepoOpt.get();

            // Refresh PAT from user record
            User user = userRepository.findByEmail(username).orElse(null);
            if (user != null) {
                String latestPat = gitService.isAzureUrl(repoUrl)
                        ? user.getAzurePat() : user.getGithubToken();
                if (latestPat != null && !latestPat.equals(gitRepo.getPersonalAccessToken())) {
                    gitRepo.setPersonalAccessToken(latestPat);
                    gitRepoRepository.save(gitRepo);
                }
            }

            String pat = encryptionService.decrypt(gitRepo.getPersonalAccessToken());
            String localPath = workspaceService.getRepoPath(username, repoUrl);
            gitService.switchBranch(localPath, branchName, pat);
            
            return ResponseEntity.ok(branchName);
        } catch (Exception e) {
            log.error("Error switching branch", e);
            String msg = e.getMessage() != null ? e.getMessage() : "Unknown error";
            if (msg.contains(".lock") || msg.contains("busy") || msg.contains("Permission denied")) {
                msg = "Git is busy, a stale lock exists, or there is a permission issue. I have attempted to clean it, but if this persists, the workspace files might be locked by another process (IDE) or have incorrect Docker permissions.";
            } else if (msg.contains("401") || msg.contains("403") || msg.contains("not authorized")) {
                msg = "Permission Denied from Azure DevOps. Your PAT may have expired or lacks 'Code (Read & Write)' permissions.";
            }
            return ResponseEntity.internalServerError().body("Error: " + msg);
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

    private Optional<GitRepository> findGitRepo(String username, String repoUrl) {
        if (repoUrl == null) return Optional.empty();
        
        String normalizedUrl = repoUrl.trim();
        if (normalizedUrl.endsWith("/")) normalizedUrl = normalizedUrl.substring(0, normalizedUrl.length() - 1);
        
        // Strategy: Try exact, then normalized, then with/without .git, then CLEANED (no creds)
        Optional<GitRepository> opt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, repoUrl);
        if (opt.isEmpty()) opt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, normalizedUrl);
        
        if (opt.isEmpty()) {
            String alt = normalizedUrl.endsWith(".git") ? normalizedUrl.substring(0, normalizedUrl.length() - 4) : normalizedUrl + ".git";
            opt = gitRepoRepository.findByUsernameAndRepositoryUrl(username, alt);
        }

        // If still not found, search by "Project Name" extracted from URL as a last resort fallback
        if (opt.isEmpty()) {
            log.info("Deep search for repo: {} for user: {}", repoUrl, username);
            String repoName = repoUrl;
            if (repoName.endsWith(".git")) repoName = repoName.substring(0, repoName.length() - 4);
            if (repoName.contains("/")) repoName = repoName.substring(repoName.lastIndexOf("/") + 1);
            
            final String targetName = repoName;
            java.util.List<GitRepository> userRepos = gitRepoRepository.findByUsername(username);
            opt = userRepos.stream()
                .filter(r -> {
                    String rUrl = r.getRepositoryUrl();
                    return rUrl != null && rUrl.toLowerCase().contains(targetName.toLowerCase());
                })
                .findFirst();
            
            if (opt.isPresent()) {
                log.info("Repo found via deep search match: {}", opt.get().getRepositoryUrl());
            } else {
                log.warn("Repository NOT found after deep search. Provided URL: {}. Registered repos for {}: {}", 
                    repoUrl, username, userRepos.stream().map(GitRepository::getRepositoryUrl).toList());
            }
        }
        
        return opt;
    }
}
