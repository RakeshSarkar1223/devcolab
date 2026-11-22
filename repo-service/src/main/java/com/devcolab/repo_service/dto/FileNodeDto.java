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
public class FileNodeDto {
    private String name;
    private String path;
    private String type; // "FILE" or "DIRECTORY"
    private long size;
    private List<FileNodeDto> children;
}
