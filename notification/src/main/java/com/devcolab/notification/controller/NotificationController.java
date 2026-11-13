package com.devcolab.notification.controller;

import com.devcolab.notification.client.AuthClient;
import com.devcolab.notification.dto.NotificationRequest;
import com.devcolab.notification.dto.NotificationResponse;
import com.devcolab.notification.dto.UnreadCountResponse;
import com.devcolab.notification.exception.UnauthorizedException;
import com.devcolab.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthClient authClient;

    private Long getLoggedInUserId(String token) {
        if (token == null || token.isBlank()) {
            throw new UnauthorizedException("Authorization token is required");
        }
        try {
            Long userId = authClient.getUserId(token);
            if (userId == null) {
                throw new UnauthorizedException("Invalid token or user not found");
            }
            return userId;
        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new UnauthorizedException("Unauthorized: " + e.getMessage());
        }
    }

    @GetMapping("/hello")
    public ResponseEntity<String> hello() {
        return ResponseEntity.ok("Hello from notification service");
    }

    /**
     * POST /api/notifications
     * Create a notification.
     */
    @PostMapping
    public ResponseEntity<NotificationResponse> createNotification(@Valid @RequestBody NotificationRequest request) {
        NotificationResponse created = notificationService.createNotification(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * GET /api/notifications
     * Get all notifications for the logged-in user.
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAllNotifications(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {
        Long userId = getLoggedInUserId(token);
        return ResponseEntity.ok(notificationService.getNotificationsForUser(userId));
    }

    /**
     * GET /api/notifications/unread
     * Get only unread notifications for the logged-in user.
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {
        Long userId = getLoggedInUserId(token);
        return ResponseEntity.ok(notificationService.getUnreadNotificationsForUser(userId));
    }

    /**
     * GET /api/notifications/unread-count
     * Get the unread notification count for the logged-in user.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {
        Long userId = getLoggedInUserId(token);
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(new UnreadCountResponse(count, userId));
    }

    /**
     * PATCH /api/notifications/{id}/read
     * Mark one notification as read for the logged-in user.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable UUID id,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {
        Long userId = getLoggedInUserId(token);
        return ResponseEntity.ok(notificationService.markAsRead(id, userId));
    }

    /**
     * PATCH /api/notifications/read-all
     * Mark all notifications as read for the logged-in user.
     */
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {
        Long userId = getLoggedInUserId(token);
        int updatedCount = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of(
                "message", "All notifications marked as read",
                "updatedCount", updatedCount,
                "userId", userId
        ));
    }

    /**
     * DELETE /api/notifications/{id}
     * Delete a notification for the logged-in user.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable UUID id,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {
        Long userId = getLoggedInUserId(token);
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/notifications/{id}
     * Get a specific notification by ID for the logged-in user.
     */
    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> getNotificationById(
            @PathVariable UUID id,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {
        Long userId = getLoggedInUserId(token);
        return ResponseEntity.ok(notificationService.getNotificationById(id, userId));
    }

    /**
     * PUT /api/notifications/{id}/status
     * Update notification status (e.g. ACCEPTED or REJECTED) for the logged-in user.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<NotificationResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {
        Long userId = getLoggedInUserId(token);
        String status = body != null ? body.get("status") : null;
        return ResponseEntity.ok(notificationService.updateStatus(id, status, userId));
    }
}
