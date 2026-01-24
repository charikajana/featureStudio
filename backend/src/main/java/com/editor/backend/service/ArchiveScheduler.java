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
    private final TestStatsService testStatsService;

    // Run every 15 minutes, starting 5 seconds after launch
    @Scheduled(fixedRate = 900000, initialDelay = 5000)
    public void scheduleTelemetryArchival() {
        log.info("Triggering scheduled telemetry vault archival heartbeat...");
        try {
            pipelineService.syncNewRunsAcrossRepos();
            testStatsService.recordTrends();
            log.info("Scheduled archival and trend recording successfully completed.");
        } catch (Exception e) {
            log.error("Scheduled archival failed: {}", e.getMessage());
        }
    }
}
