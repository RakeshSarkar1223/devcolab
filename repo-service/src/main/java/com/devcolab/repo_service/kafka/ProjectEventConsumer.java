package com.devcolab.repo_service.kafka;

import com.devcolab.repo_service.event.ProjectCreatedEvent;
import com.devcolab.repo_service.event.ProjectDeletedEvent;
import com.devcolab.repo_service.service.GitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectEventConsumer {

    private final GitService gitService;

    @KafkaListener(topics = "project-created", groupId = "repo-service-group")
    public void handleProjectCreated(ProjectCreatedEvent event) {
        log.info("Received ProjectCreatedEvent for project id: {}, name: {}", event.getProjectId(), event.getProjectName());
        try {
            gitService.initRepository(event.getProjectId());
            log.info("Auto-initialized Git repository for project id {}", event.getProjectId());
        } catch (Exception e) {
            log.error("Failed to auto-initialize Git repository for project {}: {}", event.getProjectId(), e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "project-deleted", groupId = "repo-service-group")
    public void handleProjectDeleted(ProjectDeletedEvent event) {
        log.info("Received ProjectDeletedEvent for project id: {}", event.getProjectId());
        try {
            gitService.deleteRepository(event.getProjectId());
            log.info("Cleaned up Git repository for deleted project id {}", event.getProjectId());
        } catch (Exception e) {
            log.error("Failed to delete Git repository for project {}: {}", event.getProjectId(), e.getMessage(), e);
        }
    }
}
