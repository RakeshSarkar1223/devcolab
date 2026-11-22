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
public class RepoInitializedEvent {
    private Long projectId;
    private String defaultBranch;
    private String storagePath;
    private LocalDateTime timestamp;
}
