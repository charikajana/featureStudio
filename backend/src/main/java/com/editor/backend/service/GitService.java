package com.editor.backend.service;

import com.editor.backend.model.GitRepository;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.PullResult;
import org.eclipse.jgit.api.PushCommand;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
public class GitService {

    @org.springframework.beans.factory.annotation.Value("${app.azure.devops.base-url}")
    private String azureBaseUrl;

    @org.springframework.beans.factory.annotation.Value("${app.github.base-url}")
    private String githubBaseUrl;

    public void cloneRepository(String repoUrl, String pat, String localPath) throws GitAPIException {
        String sanitizedUrl = sanitizeRepoUrl(repoUrl);
        log.info("Cloning repository {} to {}", sanitizedUrl, localPath);
        
        Git.cloneRepository()
                .setURI(sanitizedUrl)
                .setDirectory(new File(localPath))
                .setCredentialsProvider(getCredentialsProvider(sanitizedUrl, pat))
                .call()
                .close();
    }

    public void pullChanges(String localPath, String pat) throws IOException, GitAPIException {
        try (Git git = Git.open(new File(localPath))) {
            ensureCleanRemote(git);
            String url = git.getRepository().getConfig().getString("remote", "origin", "url");
            var cp = getCredentialsProvider(url, pat);
            
            String branchName = git.getRepository().getBranch();
            log.info("Attempting to pull changes for branch: {} at {}", branchName, localPath);
            
            // 1. Fetch latest from remote to update local view of remote branches
            git.fetch()
                    .setCredentialsProvider(cp)
                    .setRemoveDeletedRefs(true)
                    .call();

            // 2. Check if branch exists on remote (now using updated local view of remotes)
            var branches = git.branchList()
                    .setListMode(org.eclipse.jgit.api.ListBranchCommand.ListMode.REMOTE)
                    .call();
            
            boolean existsOnRemote = branches.stream().anyMatch(ref -> ref.getName().endsWith("/" + branchName));
            
            if (!existsOnRemote) {
                log.info("Branch {} does not exist on remote yet. Skipping pull.", branchName);
                return;
            }

            PullResult result = git.pull()
                    .setCredentialsProvider(cp)
                    .call();
            
            if (!result.isSuccessful()) {
                log.warn("Pull was not successful for {}: {}", branchName, result.toString());
            } else {
                log.info("Successfully pulled changes for {}", branchName);
            }
        }
    }

    public String createFeatureBranch(String localPath, String username) throws IOException, GitAPIException {
        try (Git git = Git.open(new File(localPath))) {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            // Extract username part before @ (e.g., charikajana@gmail.com -> charikajana)
            String sanitizedUsername = username.contains("@") 
                ? username.substring(0, username.indexOf("@"))
                : username;
            String branchName = String.format("feature/%s/%s", sanitizedUsername, timestamp);
            
            log.info("Creating and checking out new branch: {}", branchName);
            git.checkout()
                    .setCreateBranch(true)
                    .setName(branchName)
                    .call();
            
            return branchName;
        }
    }

    public void commitAndPush(String localPath, String pat, String message, String branchName) throws IOException, GitAPIException {
        commitAndPush(localPath, pat, message, branchName, null);
    }

    public void commitAndPush(String localPath, String pat, String message, String branchName, List<String> files) throws IOException, GitAPIException {
        try (Git git = Git.open(new File(localPath))) {
            ensureCleanRemote(git);
            log.info("Committing and pushing changes to branch: {}", branchName);
            
            // 1. Add specific files or all
            if (files == null || files.isEmpty()) {
                git.add().addFilepattern(".").call();
            } else {
                var addCmd = git.add();
                for (String file : files) {
                    // JGit expects forward slashes
                    String sanitized = file.replace("\\", "/");
                    log.info("Staging file: {}", sanitized);
                    addCmd.addFilepattern(sanitized);
                }
                addCmd.call();
            }
            
            // 2. Commit with message
            git.commit().setMessage(message).call();
            
            // 3. Ensure Remote URL is authenticated if needed
            String currentUrl = git.getRepository().getConfig().getString("remote", "origin", "url");
            boolean isAzure = currentUrl != null && (currentUrl.contains("dev.azure.com") || currentUrl.contains("visualstudio.com") || (azureBaseUrl != null && currentUrl.contains(azureBaseUrl.replace("https://", ""))));
            
            if (isAzure && currentUrl != null && currentUrl.contains("@")) {
                log.warn("Detected embedded username in Azure remote URL. This may cause 'not authorized' errors. Recommendation: Use a clean URL without '@'.");
            }

            // 4. Push to remote
            log.info("Pushing to origin: refs/heads/{}...", branchName);
            
            Iterable<org.eclipse.jgit.transport.PushResult> results = git.push()
                    .setRemote("origin")
                    .setCredentialsProvider(getCredentialsProvider(currentUrl, pat))
                    .setRefSpecs(new org.eclipse.jgit.transport.RefSpec("refs/heads/" + branchName + ":refs/heads/" + branchName))
                    .call();
            
            for (org.eclipse.jgit.transport.PushResult result : results) {
                result.getRemoteUpdates().forEach(update -> {
                    log.info("Push status for {}: {}", update.getRemoteName(), update.getStatus());
                    if (update.getStatus() == org.eclipse.jgit.transport.RemoteRefUpdate.Status.REJECTED_NONFASTFORWARD) {
                        log.warn("Push rejected: Non-fast-forward. User might need to pull first.");
                    }
                });
            }
            
            log.info("Successfully pushed branch: {}", branchName);
        }
    }

    public void resetToMainBranch(String localPath, String pat) throws IOException, GitAPIException {
        resetChanges(localPath, null, pat);
    }

    public void resetChanges(String localPath, java.util.List<String> files, String pat) throws IOException, GitAPIException {
        try (Git git = Git.open(new File(localPath))) {
            if (files == null || files.isEmpty()) {
                log.info("Performing full deep reset of repository at {}", localPath);
                
                // 1. Determine current branch
                String currentBranch = git.getRepository().getBranch();
                log.info("Current branch for reset: {}", currentBranch);

                // 2. Discard all local uncommitted changes
                git.reset().setMode(org.eclipse.jgit.api.ResetCommand.ResetType.HARD).call();
                
                // 3. Remove untracked files and directories
                git.clean().setCleanDirectories(true).setIgnore(false).call();
                
                // 4. Fetch latest from remote to ensure we have latest refs
                if (pat != null && !pat.isEmpty()) {
                    try {
                        ensureCleanRemote(git);
                        String url = git.getRepository().getConfig().getString("remote", "origin", "url");
                        git.fetch().setCredentialsProvider(getCredentialsProvider(url, pat)).call();
                        log.info("Fetched latest from origin");
                    } catch (Exception e) {
                        log.warn("Fetch failed during reset: {}", e.getMessage());
                    }
                }

                // 5. Hard reset local branch to match remote origin of the CURRENT branch
                try {
                    String remoteRef = "origin/" + currentBranch;
                    if (git.getRepository().findRef("refs/remotes/" + remoteRef) != null) {
                        git.reset().setMode(org.eclipse.jgit.api.ResetCommand.ResetType.HARD)
                                .setRef(remoteRef)
                                .call();
                        log.info("Local branch {} reset to remote {}", currentBranch, remoteRef);
                    } else {
                        log.info("Remote reference {} not found. Local changes are cleared, but no remote sync performed.", remoteRef);
                    }
                } catch (Exception e) {
                    log.warn("Could not reset to remote reference: {}", e.getMessage());
                }
            } else {
                log.info("Performing selective reset of {} files at {}", files.size(), localPath);
                
                var status = git.status().call();
                java.util.Set<String> untracked = status.getUntracked();
                java.util.Set<String> added = status.getAdded();

                for (String file : files) {
                    if (untracked.contains(file) || added.contains(file)) {
                        // Delete untracked or newly added file
                        File fileToDelete = new File(localPath, file);
                        if (fileToDelete.exists()) {
                            if (fileToDelete.isDirectory()) {
                                deleteDirectory(fileToDelete);
                            } else {
                                fileToDelete.delete();
                            }
                            log.info("Deleted new file/folder: {}", file);
                        }
                    } else {
                        // Checkout from HEAD (undo modifications)
                        git.checkout().addPath(file).call();
                        log.info("Reset modified file: {}", file);
                    }
                }
            }
            log.info("Repository reset/undo complete");
        }
    }

    public String getCurrentBranch(String localPath) throws IOException, GitAPIException {
        try (Git git = Git.open(new File(localPath))) {
            return git.getRepository().getBranch();
        }
    }

    public org.eclipse.jgit.api.Status getStatus(String localPath) throws IOException, GitAPIException {
        try (Git git = Git.open(new File(localPath))) {
            return git.status().call();
        }
    }

    public List<String> getAllBranches(String localPath, String pat) throws IOException, GitAPIException {
        try (Git git = Git.open(new File(localPath))) {
            return git.branchList()
                    .setListMode(org.eclipse.jgit.api.ListBranchCommand.ListMode.ALL)
                    .call().stream()
                    .map(ref -> {
                        String name = ref.getName();
                        if (name.startsWith("refs/heads/")) {
                            return name.substring("refs/heads/".length());
                        } else if (name.startsWith("refs/remotes/")) {
                            // Strip 'refs/remotes/' and then strip the first part (remote name) if it exists
                            String remoteName = name.substring("refs/remotes/".length());
                            int slashIndex = remoteName.indexOf('/');
                            if (slashIndex != -1) {
                                String branchName = remoteName.substring(slashIndex + 1);
                                if (!branchName.equals("HEAD")) {
                                    return branchName;
                                }
                            }
                            return remoteName;
                        }
                        return name;
                    })
                    .filter(name -> !name.equals("HEAD") && !name.contains("HEAD"))
                    .distinct()
                    .sorted()
                    .collect(java.util.stream.Collectors.toList());
        }
    }

    public String createBranch(String localPath, String branchName, String baseBranch) throws IOException, GitAPIException {
        try (Git git = Git.open(new File(localPath))) {
            log.info("Creating branch '{}' from base '{}'", branchName, baseBranch);
            
            // Checkout base branch first with force
            git.checkout().setName(baseBranch).setForce(true).call();
            
            // Create and checkout new branch
            git.checkout()
                    .setCreateBranch(true)
                    .setName(branchName)
                    .setStartPoint(baseBranch)
                    .call();
            
            log.info("Successfully created and checked out branch: {}", branchName);
            return branchName;
        }
    }

    public void switchBranch(String localPath, String branchName, String pat) throws IOException, GitAPIException {
        try (Git git = Git.open(new File(localPath))) {
            log.info("Saving changes and switching to branch: {}", branchName);
            
            // 1. Add and Commit local changes so they aren't lost
            try {
                git.add().addFilepattern(".").call();
                var status = git.status().call();
                if (status.hasUncommittedChanges() || !status.isClean()) {
                    git.commit()
                            .setMessage("Auto-save before switching to " + branchName)
                            .call();
                    log.info("Local changes committed before switch.");
                }
            } catch (Exception e) {
                log.warn("Auto-commit failed, proceeding with switch: {}", e.getMessage());
            }

            // 2. Fetch latest branch info with auth
            if (pat != null && !pat.isEmpty()) {
                try {
                    ensureCleanRemote(git);
                    String url = git.getRepository().getConfig().getString("remote", "origin", "url");
                    git.fetch().setCredentialsProvider(getCredentialsProvider(url, pat)).call();
                } catch (Exception e) {
                    log.warn("Fetch before switch failed: {}", e.getMessage());
                }
            }

            // 3. Check if branch is local or remote
            boolean isLocal = git.branchList().call().stream()
                    .anyMatch(ref -> ref.getName().equals("refs/heads/" + branchName));

            var checkoutCmd = git.checkout()
                    .setName(branchName)
                    .setForce(true); // Still use force to ensure it happens

            if (!isLocal) {
                log.info("Branch {} not found locally, attempting to create tracking branch from origin/{}", branchName, branchName);
                checkoutCmd.setCreateBranch(true)
                        .setStartPoint("origin/" + branchName);
            }

            checkoutCmd.call();
            log.info("Successfully switched to branch: {}", branchName);
        }
    }

    private void deleteDirectory(File directory) {
        File[] allContents = directory.listFiles();
        if (allContents != null) {
            for (File file : allContents) {
                deleteDirectory(file);
            }
        }
        directory.delete();
    }

    private String sanitizeRepoUrl(String url) {
        if (url == null || !url.contains("@")) return url;
        
        // Remove username/token from URL (e.g., https://user@dev.azure.com -> https://dev.azure.com)
        int protocolIndex = url.indexOf("://");
        int atIndex = url.lastIndexOf("@");
        if (protocolIndex != -1 && atIndex > protocolIndex) {
            return url.substring(0, protocolIndex + 3) + url.substring(atIndex + 1);
        }
        return url;
    }

    private void ensureCleanRemote(Git git) throws IOException {
        String currentUrl = git.getRepository().getConfig().getString("remote", "origin", "url");
        if (currentUrl == null) return;
        
        String sanitizedUrl = sanitizeRepoUrl(currentUrl);
        if (!currentUrl.equals(sanitizedUrl)) {
            log.info("Fixing remote URL in .git/config: removing embedded credentials from {}", currentUrl);
            git.getRepository().getConfig().setString("remote", "origin", "url", sanitizedUrl);
            git.getRepository().getConfig().save();
        }
    }

    private UsernamePasswordCredentialsProvider getCredentialsProvider(String url, String pat) {
        boolean isAzure = url != null && (url.contains("dev.azure.com") || url.contains("visualstudio.com") || (azureBaseUrl != null && url.contains(azureBaseUrl.replace("https://", ""))));
        // For Azure DevOps, an empty username is standard for PATs
        // For GitHub, "token" is often used but empty can also work. 
        // We'll stick to "" for Azure and "token" for others as it's proven.
        String username = isAzure ? "" : "token";
        return new UsernamePasswordCredentialsProvider(username, pat);
    }
}
