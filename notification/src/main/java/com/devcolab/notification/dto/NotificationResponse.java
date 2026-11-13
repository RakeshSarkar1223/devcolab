package com.devcolab.notification.dto;

import com.devcolab.notification.model.Notification;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private UUID id;

    private Long userId;

    private String message;

    @JsonProperty("read")
    private boolean read;

    private String type;

    private Long projectId;

    private String status;

    private LocalDateTime createdAt;

    public static NotificationResponse fromEntity(Notification notification) {
        if (notification == null) {
            return null;
        }
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .message(notification.getMessage())
                .read(notification.isRead())
                .type(notification.getType())
                .projectId(notification.getProjectId())
                .status(notification.getStatus())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
