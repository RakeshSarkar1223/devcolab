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
public class ProjectCreatedEvent {
    private Long projectId;
    private String projectName;
    private Long ownerId;
    private LocalDateTime createdAt;
}
