package com.devcolab.repo_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pull_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PullRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long projectId;

    private Long ownerId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String sourceBranch;

    @Column(nullable = false)
    private String targetBranch;

    @Column(nullable = false)
    private Long authorId;

    private String authorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PullRequestStatus status;

    private Boolean hasConflicts;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime mergedAt;

    private Long mergedByUserId;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = PullRequestStatus.OPEN;
        }
        if (targetBranch == null || targetBranch.isBlank()) {
            targetBranch = "main";
        }
        if (hasConflicts == null) {
            hasConflicts = false;
        }
    }
}
