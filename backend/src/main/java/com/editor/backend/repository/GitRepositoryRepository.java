package com.editor.backend.repository;

import com.editor.backend.model.GitRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GitRepositoryRepository extends JpaRepository<GitRepository, Long> {
    Optional<GitRepository> findByUsernameAndRepositoryUrl(String username, String repositoryUrl);
    java.util.List<GitRepository> findByUsername(String username);
    java.util.List<GitRepository> findAllByRepositoryUrl(String repositoryUrl); // Can return multiple (one per user)
}
