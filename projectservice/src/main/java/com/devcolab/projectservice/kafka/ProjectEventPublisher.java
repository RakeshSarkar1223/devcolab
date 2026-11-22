package com.devcolab.projectservice.kafka;

import com.devcolab.projectservice.event.InvitationResponseEvent;
import com.devcolab.projectservice.event.ProjectCreatedEvent;
import com.devcolab.projectservice.event.ProjectDeletedEvent;
import com.devcolab.projectservice.event.ProjectInvitationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProjectEventPublisher {

    private final KafkaTemplate<String, ProjectInvitationEvent> invitationKafkaTemplate;
    private final KafkaTemplate<String, InvitationResponseEvent> responseKafkaTemplate;
    private final KafkaTemplate<String, ProjectCreatedEvent> projectCreatedKafkaTemplate;
    private final KafkaTemplate<String, ProjectDeletedEvent> projectDeletedKafkaTemplate;

    public void publish(ProjectInvitationEvent event) {
        invitationKafkaTemplate.send("project-invitations", event);
    }

    public void sendResponse(InvitationResponseEvent event) {
        responseKafkaTemplate.send("invitation-response", event);
    }

    public void publishProjectCreated(ProjectCreatedEvent event) {
        projectCreatedKafkaTemplate.send("project-created", String.valueOf(event.getProjectId()), event);
    }

    public void publishProjectDeleted(ProjectDeletedEvent event) {
        projectDeletedKafkaTemplate.send("project-deleted", String.valueOf(event.getProjectId()), event);
    }
}
