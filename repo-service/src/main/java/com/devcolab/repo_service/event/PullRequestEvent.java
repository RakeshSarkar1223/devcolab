package com.devcolab.repo_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PullRequestEvent {
    private Long pullRequestId;
    private Long projectId;
    private Long ownerId;
    private String title;
    private Long authorId;
    private String authorName;
    private String sourceBranch;
    private String targetBranch;
    private String eventType; // "CREATED", "MERGED", "CLOSED"
    private LocalDateTime timestamp;
}
