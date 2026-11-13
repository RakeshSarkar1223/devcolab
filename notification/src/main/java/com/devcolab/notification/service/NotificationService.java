package com.devcolab.notification.service;

import com.devcolab.notification.dto.NotificationRequest;
import com.devcolab.notification.dto.NotificationResponse;
import com.devcolab.notification.exception.ForbiddenException;
import com.devcolab.notification.exception.ResourceNotFoundException;
import com.devcolab.notification.model.Notification;
import com.devcolab.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .message(request.getMessage())
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Notification created with id {} for user {}", saved.getId(), saved.getUserId());
        return NotificationResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(UUID id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        if (!notification.getUserId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to modify this notification");
        }

        notification.setRead(true);
        Notification updated = notificationRepository.save(notification);
        log.info("Notification {} marked as read for user {}", id, notification.getUserId());
        return NotificationResponse.fromEntity(updated);
    }

    @Transactional
    public int markAllAsRead(Long userId) {
        int updated = notificationRepository.markAllAsReadForUser(userId);
        log.info("Marked {} notifications as read for user {}", updated, userId);
        return updated;
    }

    @Transactional
    public void deleteNotification(UUID id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        if (!notification.getUserId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to delete this notification");
        }

        notificationRepository.delete(notification);
        log.info("Notification {} deleted for user {}", id, notification.getUserId());
    }

    @Transactional(readOnly = true)
    public NotificationResponse getNotificationById(UUID id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        if (!notification.getUserId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to access this notification");
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public NotificationResponse updateStatus(UUID id, String status, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        if (!notification.getUserId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to modify this notification");
        }

        if (status != null && !status.isBlank()) {
            notification.setStatus(status.toUpperCase().trim());
        }
        notification.setRead(true);
        Notification updated = notificationRepository.save(notification);
        log.info("Notification {} status updated to {} for user {}", id, notification.getStatus(), userId);
        return NotificationResponse.fromEntity(updated);
    }
}
