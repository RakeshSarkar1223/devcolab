package com.devcolab.notification.kafka;

import com.devcolab.notification.event.InvitationResponseEvent;
import com.devcolab.notification.event.ProjectInvitationEvent;
import com.devcolab.notification.model.Notification;
import com.devcolab.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {
    private final NotificationRepository notificationRepository;

    @KafkaListener(topics = "project-invitations", groupId = "notification-group")
    public void userAdded(ProjectInvitationEvent event) {
        log.info("Received project invitation event for user: {}, project: {}", event.getReceiverId(), event.getProjectId());

        String sender = (event.getSenderName() != null && !event.getSenderName().isBlank())
                ? event.getSenderName()
                : "A team member";
        String roleStr = event.getRole() != null ? event.getRole().name() : "DEVELOPER";
        String msg = String.format("%s invited you to join '%s' as %s",
                sender, event.getProjectName(), roleStr);

        Notification notification = Notification.builder()
                .userId(event.getReceiverId())
                .message(msg)
                .type("PROJECT_INVITATION")
                .projectId(event.getProjectId())
                .status("PENDING")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(notification);
        log.info("Saved invitation notification for user id {}", event.getReceiverId());
    }

    @KafkaListener(topics = "invitation-response", groupId = "notification-group")
    public void invitationResponse(InvitationResponseEvent event) {
        log.info("Received invitation response event: user {} {} invitation for project {}",
                event.getResponderId(),
                event.isAccepted() ? "accepted" : "rejected",
                event.getProjectName());

        String action = event.isAccepted() ? "accepted" : "declined";
        String roleStr = event.getRole() != null ? event.getRole().name() : "MEMBER";
        String userStr = event.getResponderId() != null ? "User #" + event.getResponderId() : "User";

        String msg = String.format("%s has %s your invitation to join '%s' as %s",
                userStr,
                action,
                event.getProjectName(),
                roleStr);

        Notification notification = Notification.builder()
                .userId(event.getReceiverId())
                .message(msg)
                .type("INVITATION_RESPONSE")
                .projectId(event.getProjectId())
                .status(event.isAccepted() ? "ACCEPTED" : "REJECTED")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(notification);
        log.info("Saved invitation response notification for owner id {}", event.getReceiverId());
    }
}
