package com.devcolab.projectservice.event;

import com.devcolab.projectservice.model.Role;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectInvitationEvent {
    private Long receiverId;
    private Long projectId;
    private String projectName;
    private Role role;
    private String senderName;
}
