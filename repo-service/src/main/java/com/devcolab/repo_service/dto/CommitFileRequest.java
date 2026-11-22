package com.devcolab.repo_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommitFileRequest {

    @NotBlank(message = "Branch is required")
    private String branch;

    @NotBlank(message = "File path is required")
    private String path;

    private String content;

    @NotBlank(message = "Commit message is required")
    private String commitMessage;

    private String authorName;

    private String authorEmail;
}
