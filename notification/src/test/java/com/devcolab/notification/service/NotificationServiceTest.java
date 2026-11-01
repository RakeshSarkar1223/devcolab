package com.devcolab.notification.service;

import com.devcolab.notification.dto.NotificationRequest;
import com.devcolab.notification.dto.NotificationResponse;
import com.devcolab.notification.exception.ForbiddenException;
import com.devcolab.notification.exception.ResourceNotFoundException;
import com.devcolab.notification.model.Notification;
import com.devcolab.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private Long userId;
    private UUID notificationId;
    private Notification sampleNotification;

    @BeforeEach
    void setUp() {
        userId = 1L;
        notificationId = UUID.randomUUID();
        sampleNotification = Notification.builder()
                .id(notificationId)
                .userId(userId)
                .message("Test notification message")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testCreateNotification() {
        NotificationRequest request = NotificationRequest.builder()
                .userId(userId)
                .message("Hello")
                .build();

        when(notificationRepository.save(any(Notification.class))).thenReturn(sampleNotification);

        NotificationResponse response = notificationService.createNotification(request);

        assertNotNull(response);
        assertEquals(sampleNotification.getId(), response.getId());
        assertEquals("Test notification message", response.getMessage());
        assertEquals(userId, response.getUserId());
        assertFalse(response.isRead());
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void testGetNotificationsForUser() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(sampleNotification));

        List<NotificationResponse> result = notificationService.getNotificationsForUser(userId);

        assertEquals(1, result.size());
        assertEquals(sampleNotification.getMessage(), result.get(0).getMessage());
        verify(notificationRepository).findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Test
    void testGetUnreadNotificationsForUser() {
        when(notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(sampleNotification));

        List<NotificationResponse> result = notificationService.getUnreadNotificationsForUser(userId);

        assertEquals(1, result.size());
        assertFalse(result.get(0).isRead());
        verify(notificationRepository).findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
    }

    @Test
    void testGetUnreadCount() {
        when(notificationRepository.countByUserIdAndReadFalse(userId)).thenReturn(5L);

        long count = notificationService.getUnreadCount(userId);

        assertEquals(5L, count);
        verify(notificationRepository).countByUserIdAndReadFalse(userId);
    }

    @Test
    void testMarkAsReadSuccess() {
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(sampleNotification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead(notificationId, userId);

        assertTrue(response.isRead());
        verify(notificationRepository).save(sampleNotification);
    }

    @Test
    void testMarkAsReadNotFound() {
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                notificationService.markAsRead(notificationId, userId)
        );
    }

    @Test
    void testMarkAsReadForbidden() {
        Long otherUser = 999L;
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(sampleNotification));

        assertThrows(ForbiddenException.class, () ->
                notificationService.markAsRead(notificationId, otherUser)
        );
    }

    @Test
    void testMarkAllAsRead() {
        when(notificationRepository.markAllAsReadForUser(userId)).thenReturn(3);

        int updated = notificationService.markAllAsRead(userId);

        assertEquals(3, updated);
        verify(notificationRepository).markAllAsReadForUser(userId);
    }

    @Test
    void testDeleteNotificationSuccess() {
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(sampleNotification));

        assertDoesNotThrow(() -> notificationService.deleteNotification(notificationId, userId));
        verify(notificationRepository).delete(sampleNotification);
    }

    @Test
    void testDeleteNotificationNotFound() {
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                notificationService.deleteNotification(notificationId, userId)
        );
    }

    @Test
    void testDeleteNotificationForbidden() {
        Long otherUser = 999L;
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(sampleNotification));

        assertThrows(ForbiddenException.class, () ->
                notificationService.deleteNotification(notificationId, otherUser)
        );
    }
}
