package com.editor.backend.controller;

import com.editor.backend.service.PipelineService;
import com.editor.backend.service.StabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/pipelines")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineService pipelineService;
    private final StabilityService stabilityService;

    @PostMapping("/trigger")
    public ResponseEntity<?> triggerPipeline(@RequestHeader("X-Username") String username,
                                           @RequestBody Map<String, Object> params) {
        try {
            Map<String, Object> result = pipelineService.triggerPipeline(username, params);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error triggering pipeline: " + e.getMessage());
        }
    }

    @GetMapping("/run/{runId}")
    public ResponseEntity<?> getPipelineRunDetails(@RequestHeader("X-Username") String username,
                                                   @PathVariable int runId,
                                                   @RequestParam String repoUrl) {
        try {
            Map<String, Object> details = pipelineService.getPipelineRunDetails(username, repoUrl, runId);
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching pipeline details: " + e.getMessage());
        }
    }

    @GetMapping("/runs")
    public ResponseEntity<?> listPipelineRuns(@RequestHeader("X-Username") String username,
                                              @RequestParam String repoUrl,
                                              @RequestParam(defaultValue = "50") int limit) {
        try {
            java.util.List<Map<String, Object>> runs = pipelineService.listPipelineRuns(username, repoUrl, limit);
            return ResponseEntity.ok(runs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error listing pipeline runs: " + e.getMessage());
        }
    }

    @GetMapping("/stability")
    public ResponseEntity<?> getStabilityStats(@RequestHeader("X-Username") String username,
                                             @RequestParam String repoUrl,
                                             @RequestParam(required = false) String branch) {
        try {
            return ResponseEntity.ok(stabilityService.calculateStability(repoUrl, branch, username));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching stability stats: " + e.getMessage());
        }
    }

    @GetMapping("/stability/explorer")
    public ResponseEntity<?> getStabilityExplorer(@RequestParam String repoUrl,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size,
                                                 @RequestParam(required = false) String search,
                                                 @RequestParam(defaultValue = "false") boolean flakyOnly) {
        try {
            return ResponseEntity.ok(stabilityService.getPaginatedStability(repoUrl, page, size, search, flakyOnly));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching stability explorer: " + e.getMessage());
        }
    }

    @PostMapping("/stability/sync")
    public ResponseEntity<?> syncVault(@RequestParam String repoUrl, @RequestHeader("X-Username") String username) {
        try {
            pipelineService.backfillRecentRuns(username, repoUrl, 100); // Trigger deeper sync
            return ResponseEntity.ok(Map.of("message", "Sync initiated for " + repoUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error initiating sync: " + e.getMessage());
        }
    }
}
