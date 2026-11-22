package com.devcolab.repo_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchDto {
    private String name;
    private boolean isDefault;
    private String latestCommitHash;
    private String latestCommitMessage;
    private String authorName;
    private String commitDate;
}
