package com.editor.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "scenario_results", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"repoUrl", "runId", "featureFile", "scenarioName"})
})
public class ScenarioResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String repoUrl;
    private String branch;
    private String featureFile;
    private String scenarioName;
    private String status; // Passed, Failed, Skipped
    private Integer durationMillis;
    private Integer runId;
    private LocalDateTime timestamp;
}
