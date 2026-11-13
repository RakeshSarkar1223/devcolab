package com.devcolab.projectservice.kafka;

import com.devcolab.projectservice.event.ProjectInvitationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProjectEventPublisher {
    private final KafkaTemplate<String, ProjectInvitationEvent> kafkaTemplate;

    public void publish(ProjectInvitationEvent event){
        kafkaTemplate.send("project-invitations", event);
    }
}
