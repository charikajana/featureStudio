package com.editor.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class ArchiveScheduler {

    private final PipelineService pipelineService;

    // Run every 15 minutes
    @Scheduled(fixedRate = 900000)
    public void scheduleTelemetryArchival() {
        log.info("Triggering scheduled telemetry vault archival heartbeat...");
        try {
            pipelineService.syncNewRunsAcrossRepos();
            log.info("Scheduled archival successfully completed.");
        } catch (Exception e) {
            log.error("Scheduled archival failed: {}", e.getMessage());
        }
    }
}
