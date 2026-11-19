package com.devcolab.projectservice.kafka;

import com.devcolab.projectservice.event.InvitationResponseEvent;
import com.devcolab.projectservice.event.ProjectInvitationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProjectEventPublisher {

    private final KafkaTemplate<String, ProjectInvitationEvent> invitationKafkaTemplate;
    private final KafkaTemplate<String, InvitationResponseEvent> responseKafkaTemplate;

    public void publish(ProjectInvitationEvent event) {
        invitationKafkaTemplate.send("project-invitations", event);
    }

    public void sendResponse(InvitationResponseEvent event) {
        responseKafkaTemplate.send("invitation-response", event);
    }
}
