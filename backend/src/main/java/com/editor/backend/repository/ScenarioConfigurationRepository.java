package com.editor.backend.repository;

import com.editor.backend.model.ScenarioConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ScenarioConfigurationRepository extends JpaRepository<ScenarioConfiguration, Long> {
    List<ScenarioConfiguration> findByRepoUrl(String repoUrl);
    Optional<ScenarioConfiguration> findByRepoUrlAndFeatureFileAndScenarioName(String repoUrl, String featureFile, String scenarioName);
}
