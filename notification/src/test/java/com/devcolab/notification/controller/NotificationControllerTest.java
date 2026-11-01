package com.devcolab.notification.controller;

import com.devcolab.notification.client.AuthClient;
import com.devcolab.notification.dto.NotificationRequest;
import com.devcolab.notification.dto.NotificationResponse;
import com.devcolab.notification.exception.ForbiddenException;
import com.devcolab.notification.exception.GlobalExceptionHandler;
import com.devcolab.notification.exception.ResourceNotFoundException;
import com.devcolab.notification.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuthClient authClient;

    @InjectMocks
    private NotificationController notificationController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Long userId;
    private UUID notificationId;
    private NotificationResponse sampleResponse;
    private final String validToken = "Bearer valid-jwt-token";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        userId = 1L;
        notificationId = UUID.randomUUID();

        sampleResponse = NotificationResponse.builder()
                .id(notificationId)
                .userId(userId)
                .message("Test notification")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testGetAllNotifications_WithValidToken() throws Exception {
        when(authClient.getUserId(validToken)).thenReturn(userId);
        when(notificationService.getNotificationsForUser(userId)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(notificationId.toString()))
                .andExpect(jsonPath("$[0].userId").value(1))
                .andExpect(jsonPath("$[0].message").value("Test notification"))
                .andExpect(jsonPath("$[0].read").value(false));

        verify(authClient).getUserId(validToken);
        verify(notificationService).getNotificationsForUser(userId);
    }

    @Test
    void testGetAllNotifications_MissingAuthHeader() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Missing required header: Authorization"));
    }

    @Test
    void testGetAllNotifications_InvalidToken() throws Exception {
        when(authClient.getUserId("Bearer invalid-token")).thenReturn(null);

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid token or user not found"));
    }

    @Test
    void testGetUnreadNotifications() throws Exception {
        when(authClient.getUserId(validToken)).thenReturn(userId);
        when(notificationService.getUnreadNotificationsForUser(userId)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/notifications/unread")
                        .header(HttpHeaders.AUTHORIZATION, validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(notificationId.toString()))
                .andExpect(jsonPath("$[0].read").value(false));

        verify(authClient).getUserId(validToken);
        verify(notificationService).getUnreadNotificationsForUser(userId);
    }

    @Test
    void testGetUnreadCount() throws Exception {
        when(authClient.getUserId(validToken)).thenReturn(userId);
        when(notificationService.getUnreadCount(userId)).thenReturn(7L);

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header(HttpHeaders.AUTHORIZATION, validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(7))
                .andExpect(jsonPath("$.userId").value(1));

        verify(authClient).getUserId(validToken);
        verify(notificationService).getUnreadCount(userId);
    }

    @Test
    void testMarkAsRead() throws Exception {
        sampleResponse.setRead(true);
        when(authClient.getUserId(validToken)).thenReturn(userId);
        when(notificationService.markAsRead(eq(notificationId), eq(userId))).thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/notifications/{id}/read", notificationId)
                        .header(HttpHeaders.AUTHORIZATION, validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(notificationId.toString()))
                .andExpect(jsonPath("$.read").value(true));

        verify(authClient).getUserId(validToken);
        verify(notificationService).markAsRead(eq(notificationId), eq(userId));
    }

    @Test
    void testMarkAllAsRead() throws Exception {
        when(authClient.getUserId(validToken)).thenReturn(userId);
        when(notificationService.markAllAsRead(userId)).thenReturn(4);

        mockMvc.perform(patch("/api/notifications/read-all")
                        .header(HttpHeaders.AUTHORIZATION, validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedCount").value(4))
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.message").value("All notifications marked as read"));

        verify(authClient).getUserId(validToken);
        verify(notificationService).markAllAsRead(userId);
    }

    @Test
    void testDeleteNotification() throws Exception {
        when(authClient.getUserId(validToken)).thenReturn(userId);
        doNothing().when(notificationService).deleteNotification(eq(notificationId), eq(userId));

        mockMvc.perform(delete("/api/notifications/{id}", notificationId)
                        .header(HttpHeaders.AUTHORIZATION, validToken))
                .andExpect(status().isNoContent());

        verify(authClient).getUserId(validToken);
        verify(notificationService).deleteNotification(eq(notificationId), eq(userId));
    }

    @Test
    void testCreateNotification() throws Exception {
        NotificationRequest request = NotificationRequest.builder()
                .userId(userId)
                .message("Test notification")
                .build();

        when(notificationService.createNotification(any(NotificationRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(notificationId.toString()))
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.message").value("Test notification"));

        verify(notificationService).createNotification(any(NotificationRequest.class));
    }

    @Test
    void testMarkAsReadNotFound() throws Exception {
        when(authClient.getUserId(validToken)).thenReturn(userId);
        when(notificationService.markAsRead(eq(notificationId), eq(userId)))
                .thenThrow(new ResourceNotFoundException("Notification not found with id: " + notificationId));

        mockMvc.perform(patch("/api/notifications/{id}/read", notificationId)
                        .header(HttpHeaders.AUTHORIZATION, validToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Notification not found with id: " + notificationId));
    }

    @Test
    void testMarkAsReadForbidden() throws Exception {
        when(authClient.getUserId(validToken)).thenReturn(userId);
        when(notificationService.markAsRead(eq(notificationId), eq(userId)))
                .thenThrow(new ForbiddenException("You do not have permission to modify this notification"));

        mockMvc.perform(patch("/api/notifications/{id}/read", notificationId)
                        .header(HttpHeaders.AUTHORIZATION, validToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("You do not have permission to modify this notification"));
    }
}
