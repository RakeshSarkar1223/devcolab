package com.devcolab.notification.kafka;

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

    @KafkaListener(topics = "project-invitations")
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
}
