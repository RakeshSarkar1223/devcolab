package com.devcolab.notification.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDeletedEvent {
    private Long projectId;
    private String projectName;
    private Long ownerId;
    private List<Long> memberUserIds;
    private LocalDateTime timestamp;
}
