package com.devcolab.projectservice.event;

import com.devcolab.projectservice.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InvitationResponseEvent {
    private Long receiverId;
    private Long responderId;
    private Long projectId;
    private String projectName;
    private Role role;
    private boolean accepted;
}
