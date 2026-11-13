package com.devcolab.notification.event;

import com.devcolab.notification.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProjectInvitationEvent {
    private Long receiverId;
    private Long projectId;
    private String projectName;
    private Role role;
    private String senderName;
}