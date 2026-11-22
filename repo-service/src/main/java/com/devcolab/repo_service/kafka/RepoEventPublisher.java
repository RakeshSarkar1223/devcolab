package com.devcolab.repo_service.kafka;

import com.devcolab.repo_service.event.PullRequestEvent;
import com.devcolab.repo_service.event.RepoInitializedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RepoEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public static final String TOPIC_PULL_REQUEST = "pull-request-events";
    public static final String TOPIC_REPO_INIT = "repo-events";

    public void publishPullRequestEvent(PullRequestEvent event) {
        try {
            log.info("Publishing PullRequestEvent: {}", event);
            kafkaTemplate.send(TOPIC_PULL_REQUEST, String.valueOf(event.getProjectId()), event);
        } catch (Exception e) {
            log.error("Failed to publish PullRequestEvent: {}", e.getMessage(), e);
        }
    }

    public void publishRepoInitEvent(RepoInitializedEvent event) {
        try {
            log.info("Publishing RepoInitializedEvent: {}", event);
            kafkaTemplate.send(TOPIC_REPO_INIT, String.valueOf(event.getProjectId()), event);
        } catch (Exception e) {
            log.error("Failed to publish RepoInitializedEvent: {}", e.getMessage(), e);
        }
    }
}
