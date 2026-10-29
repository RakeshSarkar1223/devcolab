package com.devcolab.projectservice.dto;

import com.devcolab.projectservice.model.MemberStatus;
import com.devcolab.projectservice.model.Role;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMemberRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Role is required")
    private Role role;

    private MemberStatus status;
}
