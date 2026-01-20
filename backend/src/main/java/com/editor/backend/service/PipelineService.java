package com.editor.backend.service;

import com.editor.backend.model.User;
import com.editor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.Collections;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class PipelineService {

    private final UserRepository userRepository;
    private final com.editor.backend.repository.GitRepositoryRepository gitRepoRepository;
    private final EncryptionService encryptionService;
    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> triggerPipeline(String username, Map<String, Object> requestParams) throws Exception {
        String repoUrl = (String) requestParams.get("repoUrl");
        if (repoUrl == null || repoUrl.isEmpty()) {
            throw new IllegalArgumentException("Repository URL is required to trigger a pipeline.");
        }

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        com.editor.backend.model.GitRepository repo = gitRepoRepository.findByUsernameAndRepositoryUrl(username, repoUrl)
                .orElseThrow(() -> new RuntimeException("Repository configuration not found for " + repoUrl));

        if (user.getAzurePat() == null || repo.getAzureOrg() == null || 
            repo.getAzureProject() == null || repo.getAzurePipelineId() == null) {
            throw new IllegalArgumentException("Azure DevOps settings for this project are incomplete. Please update them in Settings -> Repositories.");
        }

        String pipelineId = repo.getAzurePipelineId();
        if (pipelineId != null && pipelineId.contains("=")) {
            pipelineId = pipelineId.substring(pipelineId.lastIndexOf("=") + 1);
        }

        String decryptedPat = encryptionService.decrypt(user.getAzurePat());
        String url = String.format("https://dev.azure.com/%s/%s/_apis/pipelines/%s/runs?api-version=7.1-preview.1",
                repo.getAzureOrg(), repo.getAzureProject(), pipelineId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        
        // Basic auth: user is empty, password is PAT
        String auth = ":" + decryptedPat;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
        headers.set("Authorization", "Basic " + encodedAuth);

        // Build request body according to Azure DevOps REST API schema
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("previewRun", false);

        // Add branch resource if provided, or default to main
        String branch = (String) requestParams.getOrDefault("branch", "main");
        if (!branch.startsWith("refs/")) {
            branch = "refs/heads/" + branch;
        }

        Map<String, Object> resources = new java.util.HashMap<>();
        Map<String, Object> repositories = new java.util.HashMap<>();
        Map<String, Object> selfRepo = new java.util.HashMap<>();
        selfRepo.put("refName", branch);
        repositories.put("self", selfRepo);
        resources.put("repositories", repositories);
        body.put("resources", resources);

        // Add template parameters if provided
        if (requestParams.containsKey("templateParameters")) {
            body.put("templateParameters", requestParams.get("templateParameters"));
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            log.info("Triggering Azure DevOps pipeline at URL: {}", url);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            log.info("Pipeline triggered successfully. Status: {}", response.getStatusCode());
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to trigger Azure DevOps pipeline", e);
            throw new RuntimeException("Azure DevOps Pipeline Trigger Failed: " + e.getMessage());
        }
    }

    /**
     * Fetch detailed information about a specific pipeline run
     * This method allows ALL users to view pipeline details without requiring their own Azure PAT.
     * It uses a shared repository configuration's PAT from any user who has configured it.
     * @param username User's email (used for logging/audit only, not for PAT retrieval)
     * @param repoUrl Repository URL to identify the Azure project
     * @param runId Pipeline run ID returned from triggerPipeline
     * @return Map containing run details, test results, execution time, etc.
     */
    public Map<String, Object> getPipelineRunDetails(String username, String repoUrl, int runId) throws Exception {
        // User lookup is only for logging/audit purposes
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Use shared repository lookup
        java.util.List<com.editor.backend.model.GitRepository> repos = gitRepoRepository.findAllByRepositoryUrl(repoUrl);
        if (repos.isEmpty()) {
            throw new RuntimeException("Repository configuration not found for: " + repoUrl);
        }
        
        com.editor.backend.model.GitRepository repo = repos.get(0);
        
        // Find a user who has configured Azure PAT for authentication
        User userWithPat = null;
        for (com.editor.backend.model.GitRepository r : repos) {
            User repoOwner = userRepository.findByEmail(r.getUsername())
                    .orElse(null);
            if (repoOwner != null && repoOwner.getAzurePat() != null) {
                userWithPat = repoOwner;
                break;
            }
        }
        
        if (userWithPat == null) {
            throw new RuntimeException("No Azure DevOps credentials available for this repository.");
        }

        String decryptedPat = encryptionService.decrypt(userWithPat.getAzurePat());
        String baseUrl = String.format("https://dev.azure.com/%s/%s/_apis", repo.getAzureOrg(), repo.getAzureProject());

        log.info("User '{}' is viewing pipeline run details for runId {} in '{}' (using shared credentials)", 
                 username, runId, repoUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        String auth = ":" + decryptedPat;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
        headers.set("Authorization", "Basic " + encodedAuth);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        Map<String, Object> result = new java.util.HashMap<>();

        try {
            // 1. Get Pipeline Run Details
            String runUrl = baseUrl + "/pipelines/" + repo.getAzurePipelineId() + "/runs/" + runId + "?api-version=7.1-preview.1";
            ResponseEntity<Map> runResponse = restTemplate.exchange(runUrl, org.springframework.http.HttpMethod.GET, entity, Map.class);
            Map<String, Object> runData = runResponse.getBody();

            if (runData != null) {
                result.put("runId", runData.get("id"));
                result.put("buildNumber", runData.get("name"));
                result.put("state", runData.get("state")); // notStarted, inProgress, completed
                result.put("result", runData.get("result")); // succeeded, failed, canceled
                result.put("createdDate", runData.get("createdDate"));
                result.put("finishedDate", runData.get("finishedDate"));
                
                // Construct custom URL pointing to test results tab
                String customUrl = String.format(
                    "https://dev.azure.com/%s/%s/_build/results?buildId=%d&view=ms.vss-test-web.build-test-results-tab",
                    repo.getAzureOrg(), 
                    repo.getAzureProject(), 
                    runId
                );
                result.put("url", customUrl);

                // Calculate execution time if finished
                if (runData.get("createdDate") != null && runData.get("finishedDate") != null) {
                    // You can calculate duration here if needed
                    result.put("executionTime", "Calculated from dates");
                }
            }

            // 2. Get Test Results (if run is completed or failed)
            String testRunsUrl = baseUrl + "/test/runs?buildUri=vstfs:///Build/Build/" + runId + "&api-version=7.1";
            
            try {
                ResponseEntity<Map> testRunsResponse = restTemplate.exchange(testRunsUrl, org.springframework.http.HttpMethod.GET, entity, Map.class);
                Map<String, Object> testRunsData = testRunsResponse.getBody();

                if (testRunsData != null && testRunsData.containsKey("value")) {
                    java.util.List<Map<String, Object>> testRuns = (java.util.List<Map<String, Object>>) testRunsData.get("value");
                    
                    int totalPassed = 0;
                    int totalFailed = 0;
                    int totalSkipped = 0;
                    int totalTests = 0;

                    for (Map<String, Object> testRun : testRuns) {
                        Map<String, Object> runStatistics = (Map<String, Object>) testRun.get("runStatistics");
                        if (runStatistics != null) {
                            java.util.List<Map<String, Object>> stats = (java.util.List<Map<String, Object>>) runStatistics.get("value");
                            if (stats != null) {
                                for (Map<String, Object> stat : stats) {
                                    String outcome = (String) stat.get("outcome");
                                    Integer count = (Integer) stat.get("count");
                                    if (count != null) {
                                        totalTests += count;
                                        if ("Passed".equalsIgnoreCase(outcome)) {
                                            totalPassed += count;
                                        } else if ("Failed".equalsIgnoreCase(outcome)) {
                                            totalFailed += count;
                                        } else if ("NotExecuted".equalsIgnoreCase(outcome) || "Skipped".equalsIgnoreCase(outcome)) {
                                            totalSkipped += count;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Map<String, Object> testResults = new java.util.HashMap<>();
                    testResults.put("totalTests", totalTests);
                    testResults.put("passed", totalPassed);
                    testResults.put("failed", totalFailed);
                    testResults.put("skipped", totalSkipped);
                    testResults.put("passRate", totalTests > 0 ? (totalPassed * 100.0 / totalTests) : 0);
                    result.put("testResults", testResults);
                }
            } catch (Exception e) {
                log.warn("Could not fetch test results for run {}: {}", runId, e.getMessage());
                result.put("testResults", Map.of("totalTests", 0, "passed", 0, "failed", 0, "skipped", 0));
            }

            return result;

        } catch (Exception e) {
            log.error("Failed to fetch pipeline run details", e);
            throw new RuntimeException("Failed to fetch pipeline details: " + e.getMessage());
        }
    }

    /**
     * List recent pipeline runs for a repository
     * This method allows ALL users to view pipeline history without requiring their own Azure PAT.
     * It uses a shared repository configuration's PAT from any user who has configured it.
     * @param username User's email (used for logging/audit only, not for PAT retrieval)
     * @param repoUrl Repository URL to identify the Azure project
     * @param limit Maximum number of runs to return (default 50)
     * @return List of pipeline run summaries
     */
    public java.util.List<Map<String, Object>> listPipelineRuns(String username, String repoUrl, int limit) throws Exception {
        // Default to a smaller limit if not specified or too high to improve performance
        int fetchLimit = (limit <= 0 || limit > 20) ? 20 : limit;
        
        // User lookup is only for logging/audit purposes, not for PAT retrieval
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Use shared repository lookup (not user-specific)
        // Multiple users may have configured the same repo, so get all and use the first one
        java.util.List<com.editor.backend.model.GitRepository> repos = gitRepoRepository.findAllByRepositoryUrl(repoUrl);
        if (repos.isEmpty()) {
            throw new RuntimeException("Repository configuration not found for: " + repoUrl + 
                ". Please ensure at least one administrator has configured this repository with Azure DevOps settings.");
        }
        
        com.editor.backend.model.GitRepository repo = repos.get(0); // Use first configuration
        
        // Find a user who has configured Azure PAT for authentication
        // This allows viewing without requiring every user to have their own PAT
        User userWithPat = null;
        for (com.editor.backend.model.GitRepository r : repos) {
            User repoOwner = userRepository.findByEmail(r.getUsername())
                    .orElse(null);
            if (repoOwner != null && repoOwner.getAzurePat() != null) {
                userWithPat = repoOwner;
                break;
            }
        }
        
        if (userWithPat == null) {
            throw new RuntimeException("No Azure DevOps credentials available for this repository. " +
                "Please ensure at least one administrator has configured their Azure PAT in Settings.");
        }

        String pipelineId = repo.getAzurePipelineId();
        if (pipelineId != null && pipelineId.contains("=")) {
            pipelineId = pipelineId.substring(pipelineId.lastIndexOf("=") + 1);
        }

        // Use the PAT from the user who has it configured (not necessarily the current user)
        String decryptedPat = encryptionService.decrypt(userWithPat.getAzurePat());
        String url = String.format("https://dev.azure.com/%s/%s/_apis/pipelines/%s/runs?api-version=7.1-preview.1&$top=%d",
                repo.getAzureOrg(), repo.getAzureProject(), pipelineId, fetchLimit);

        log.info("User '{}' is viewing pipeline history for '{}' (using shared credentials)", username, repoUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        String auth = ":" + decryptedPat;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
        headers.set("Authorization", "Basic " + encodedAuth);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            log.info("Fetching pipeline runs from: {}", url);
            ResponseEntity<Map> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("value")) {
                java.util.List<Map<String, Object>> runs = (java.util.List<Map<String, Object>>) responseBody.get("value");
                
                // Transform to simplified format
                java.util.List<Map<String, Object>> simplifiedRuns = new java.util.ArrayList<>();
                for (Map<String, Object> run : runs) {
                    Map<String, Object> simplified = new java.util.HashMap<>();
                    simplified.put("runId", run.get("id"));
                    simplified.put("buildNumber", run.get("name"));
                    simplified.put("state", run.get("state"));
                    simplified.put("result", run.get("result"));
                    simplified.put("createdDate", run.get("createdDate"));
                    simplified.put("finishedDate", run.get("finishedDate"));
                    
                    // Construct dynamic test results URL
                    String customUrl = String.format(
                        "https://dev.azure.com/%s/%s/_build/results?buildId=%s&view=ms.vss-test-web.build-test-results-tab",
                        repo.getAzureOrg(), 
                        repo.getAzureProject(), 
                        run.get("id")
                    );
                    simplified.put("url", customUrl);
                    
                    // Extract triggered by user
                    String triggeredBy = "Unknown";
                    
                    // Log available fields for debugging
                    log.debug("Available fields in run: {}", run.keySet());
                    
                    // Try multiple possible field names
                    if (run.containsKey("requestedBy")) {
                        Map<String, Object> requestedBy = (Map<String, Object>) run.get("requestedBy");
                        log.debug("requestedBy object: {}", requestedBy);
                        if (requestedBy != null && requestedBy.containsKey("displayName")) {
                            triggeredBy = (String) requestedBy.get("displayName");
                        }
                    } else if (run.containsKey("requestedFor")) {
                        Map<String, Object> requestedFor = (Map<String, Object>) run.get("requestedFor");
                        log.debug("requestedFor object: {}", requestedFor);
                        if (requestedFor != null && requestedFor.containsKey("displayName")) {
                            triggeredBy = (String) requestedFor.get("displayName");
                        }
                    } else if (run.containsKey("triggeredBy")) {
                        Map<String, Object> tbObj = (Map<String, Object>) run.get("triggeredBy");
                        if (tbObj != null && tbObj.containsKey("displayName")) {
                            triggeredBy = (String) tbObj.get("displayName");
                        }
                    } else if (run.containsKey("createdBy")) {
                        Map<String, Object> createdBy = (Map<String, Object>) run.get("createdBy");
                        log.debug("createdBy object: {}", createdBy);
                        if (createdBy != null && createdBy.containsKey("displayName")) {
                            triggeredBy = (String) createdBy.get("displayName");
                        }
                    }
                    
                    log.info("Extracted triggeredBy: {}", triggeredBy);
                    simplified.put("triggeredBy", triggeredBy);
                    
                    // Fetch test results for completed builds
                    Integer runId = (Integer) run.get("id");
                    if (runId != null && "completed".equals(run.get("state"))) {
                        try {
                            String testRunsUrl = String.format(
                                "https://dev.azure.com/%s/%s/_apis/test/runs?buildUri=vstfs:///Build/Build/%d&api-version=7.1",
                                repo.getAzureOrg(), repo.getAzureProject(), runId
                            );
                            
                            ResponseEntity<Map> testRunsResponse = restTemplate.exchange(
                                testRunsUrl, 
                                org.springframework.http.HttpMethod.GET, 
                                entity, 
                                Map.class
                            );
                            Map<String, Object> testRunsData = testRunsResponse.getBody();
                            
                            if (testRunsData != null && testRunsData.containsKey("value")) {
                                java.util.List<Map<String, Object>> testRuns = 
                                    (java.util.List<Map<String, Object>>) testRunsData.get("value");
                                
                                int totalPassed = 0;
                                int totalFailed = 0;
                                int totalSkipped = 0;
                                int totalTests = 0;
                                
                                for (Map<String, Object> testRun : testRuns) {
                                    if (testRun.containsKey("passedTests")) {
                                        totalPassed += ((Number) testRun.get("passedTests")).intValue();
                                    }
                                    if (testRun.containsKey("unanalyzedTests")) {
                                        totalFailed += ((Number) testRun.get("unanalyzedTests")).intValue();
                                    }
                                    if (testRun.containsKey("incompleteTests")) {
                                        totalSkipped += ((Number) testRun.get("incompleteTests")).intValue();
                                    }
                                    if (testRun.containsKey("totalTests")) {
                                        totalTests += ((Number) testRun.get("totalTests")).intValue();
                                    }
                                }
                                
                                simplified.put("testsPassed", totalPassed);
                                simplified.put("testsFailed", totalFailed);
                                simplified.put("testsSkipped", totalSkipped);
                                simplified.put("testsTotal", totalTests);
                                
                                log.debug("Test results for run {}: {} passed, {} failed, {} total", 
                                    runId, totalPassed, totalFailed, totalTests);
                            } else {
                                // No test results available
                                simplified.put("testsPassed", 0);
                                simplified.put("testsFailed", 0);
                                simplified.put("testsSkipped", 0);
                                simplified.put("testsTotal", 0);
                            }
                        } catch (Exception e) {
                            log.warn("Could not fetch test results for run {}: {}", runId, e.getMessage());
                            // Set default values if test results can't be fetched
                            simplified.put("testsPassed", 0);
                            simplified.put("testsFailed", 0);
                            simplified.put("testsSkipped", 0);
                            simplified.put("testsTotal", 0);
                        }
                    } else {
                        // Build not completed yet or no run ID
                        simplified.put("testsPassed", null);
                        simplified.put("testsFailed", null);
                        simplified.put("testsSkipped", null);
                        simplified.put("testsTotal", null);
                    }
                    
                    simplifiedRuns.add(simplified);
                }
                
                return simplifiedRuns;
            }

            return new java.util.ArrayList<>();

        } catch (Exception e) {
            log.error("Failed to list pipeline runs", e);
            throw new RuntimeException("Failed to list pipeline runs: " + e.getMessage());
        }
    }
}
