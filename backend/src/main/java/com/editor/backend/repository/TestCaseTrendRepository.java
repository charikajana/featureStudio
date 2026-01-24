package com.editor.backend.repository;

import com.editor.backend.model.TestCaseTrend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestCaseTrendRepository extends JpaRepository<TestCaseTrend, Long> {
    List<TestCaseTrend> findByRepositoryUrlAndBranchOrderByCapturedAtAsc(String repositoryUrl, String branch);
}
