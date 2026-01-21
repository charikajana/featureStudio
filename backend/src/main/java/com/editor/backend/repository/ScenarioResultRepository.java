package com.editor.backend.repository;

import com.editor.backend.model.ScenarioResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScenarioResultRepository extends JpaRepository<ScenarioResult, Long> {
    List<ScenarioResult> findByRepoUrlAndBranch(String repoUrl, String branch);
    List<ScenarioResult> findByRepoUrl(String repoUrl);
    
    @Query("SELECT s.scenarioName, s.status, COUNT(s) FROM ScenarioResult s " +
           "WHERE s.repoUrl = ?1 AND s.branch = ?2 " +
           "GROUP BY s.scenarioName, s.status")
    List<Object[]> getStabilityStats(String repoUrl, String branch);

    List<ScenarioResult> findTop50ByRepoUrlAndBranchOrderByTimestampDesc(String repoUrl, String branch);
}
