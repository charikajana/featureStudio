package com.editor.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "git_repositories")
public class GitRepository {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String repositoryUrl;

    @Column(nullable = false)
    private String personalAccessToken; // To be encrypted

    @Column(nullable = false)
    private String localPath;

    private String lastSyncedBranch;

    private String azureOrg;
    private String azureProject;
    private String azurePipelineId;
    
    private Integer lastSyncedRunId;

    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
