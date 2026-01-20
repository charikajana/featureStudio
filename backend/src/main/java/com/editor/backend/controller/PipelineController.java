package com.editor.backend.controller;

import com.editor.backend.service.PipelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/pipelines")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineService pipelineService;

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
}
