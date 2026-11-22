package com.devcolab.notification.kafka;

import com.devcolab.notification.event.InvitationResponseEvent;
import com.devcolab.notification.event.ProjectDeletedEvent;
import com.devcolab.notification.event.ProjectInvitationEvent;
import com.devcolab.notification.event.PullRequestEvent;
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

    @KafkaListener(topics = "pull-request-events", groupId = "notification-group")
    public void pullRequestEvent(PullRequestEvent event) {
        log.info("Received pull request event for project {}, PR #{}, type: {}",
                event.getProjectId(), event.getPullRequestId(), event.getEventType());

        String eventType = event.getEventType() != null ? event.getEventType().toUpperCase() : "CREATED";
        Long recipientId;
        String message;

        if ("CREATED".equals(eventType)) {
            recipientId = event.getOwnerId();
            if (recipientId == null) {
                log.warn("Cannot notify owner for PR #{} because ownerId is null", event.getPullRequestId());
                return;
            }
            message = String.format("%s submitted Pull Request #%d: '%s' (%s -> %s)",
                    event.getAuthorName() != null ? event.getAuthorName() : "A team member",
                    event.getPullRequestId(),
                    event.getTitle(),
                    event.getSourceBranch(),
                    event.getTargetBranch());
        } else if ("MERGED".equals(eventType)) {
            recipientId = event.getAuthorId();
            message = String.format("Your Pull Request #%d: '%s' has been merged into %s",
                    event.getPullRequestId(),
                    event.getTitle(),
                    event.getTargetBranch());
        } else if ("CLOSED".equals(eventType)) {
            recipientId = event.getAuthorId();
            message = String.format("Your Pull Request #%d: '%s' was closed without merging",
                    event.getPullRequestId(),
                    event.getTitle());
        } else {
            return;
        }

        Notification notification = Notification.builder()
                .userId(recipientId)
                .message(message)
                .type("PULL_REQUEST_" + eventType)
                .projectId(event.getProjectId())
                .status(eventType)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(notification);
        log.info("Saved PR {} notification for user id {}", eventType, recipientId);
    }

    @KafkaListener(topics = "project-deleted", groupId = "notification-group")
    public void projectDeleted(ProjectDeletedEvent event) {
        log.info("Received project-deleted event for project: {} (ID #{}) with {} members",
                event.getProjectName(), event.getProjectId(),
                event.getMemberUserIds() != null ? event.getMemberUserIds().size() : 0);

        if (event.getMemberUserIds() == null || event.getMemberUserIds().isEmpty()) {
            return;
        }

        String msg = String.format("Project '%s' (ID #%d) was deleted by the owner.",
                event.getProjectName(), event.getProjectId());

        for (Long memberId : event.getMemberUserIds()) {
            Notification notification = Notification.builder()
                    .userId(memberId)
                    .message(msg)
                    .type("PROJECT_DELETED")
                    .projectId(event.getProjectId())
                    .status("DELETED")
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notification);
            log.info("Saved project deletion notification for member id {}", memberId);
        }
    }
}
