package com.devcolab.repo_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiffResultDto {
    private String sourceBranch;
    private String targetBranch;
    private String rawDiff;
    private List<String> changedFiles;
    private boolean hasConflicts;
    private List<String> conflictingFiles;
}
