package com.editor.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "scenario_configurations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String repoUrl;

    @Column(nullable = false)
    private String featureFile;

    @Column(nullable = false)
    private String scenarioName;

    private Long expectedDurationMillis;
}
