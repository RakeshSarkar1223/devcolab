package com.devcolab.projectservice.dto;

import com.devcolab.projectservice.model.MemberStatus;
import com.devcolab.projectservice.model.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMemberRequest {
    private Role role;
    private MemberStatus status;
}
