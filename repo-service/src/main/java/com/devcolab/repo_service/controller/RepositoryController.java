package com.devcolab.repo_service.controller;

import com.devcolab.repo_service.dto.*;
import com.devcolab.repo_service.model.PullRequest;
import com.devcolab.repo_service.model.PullRequestStatus;
import com.devcolab.repo_service.service.GitService;
import com.devcolab.repo_service.service.PullRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/repos")
@RequiredArgsConstructor
public class RepositoryController {

    private final GitService gitService;
    private final PullRequestService pullRequestService;

    /**
     * Initializes repository for project.
     */
    @PostMapping("/{projectId}/init")
    public ResponseEntity<Map<String, Object>> initRepository(@PathVariable Long projectId) {
        gitService.initRepository(projectId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Repository initialized successfully");
        resp.put("projectId", projectId);
        resp.put("defaultBranch", "main");
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    /**
     * Checks if repository exists for project.
     */
    @GetMapping("/{projectId}/exists")
    public ResponseEntity<Map<String, Object>> checkRepoExists(@PathVariable Long projectId) {
        boolean exists = gitService.repositoryExists(projectId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("projectId", projectId);
        resp.put("exists", exists);
        return ResponseEntity.ok(resp);
    }

    /**
     * Lists all branches for a project.
     */
    @GetMapping("/{projectId}/branches")
    public ResponseEntity<List<BranchDto>> listBranches(@PathVariable Long projectId) {
        return ResponseEntity.ok(gitService.listBranches(projectId));
    }

    /**
     * Creates a new branch for a user.
     */
    @PostMapping("/{projectId}/branches")
    public ResponseEntity<Map<String, Object>> createBranch(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateBranchRequest req) {
        gitService.createBranch(projectId, req.getBranchName(), req.getBaseBranch());
        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Branch created successfully");
        resp.put("branch", req.getBranchName());
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    /**
     * Returns file tree for Monaco Editor sidebar.
     */
    @GetMapping("/{projectId}/tree")
    public ResponseEntity<List<FileNodeDto>> getTree(
            @PathVariable Long projectId,
            @RequestParam(required = false, defaultValue = "main") String branch,
            @RequestParam(required = false) String subPath) {
        return ResponseEntity.ok(gitService.getTree(projectId, branch, subPath));
    }

    /**
     * Returns file content for Monaco Editor.
     */
    @GetMapping("/{projectId}/blob")
    public ResponseEntity<FileContentDto> getFileContent(
            @PathVariable Long projectId,
            @RequestParam(required = false, defaultValue = "main") String branch,
            @RequestParam String path) {
        return ResponseEntity.ok(gitService.getFileContent(projectId, branch, path));
    }

    /**
     * Commits a file change/creation to a branch.
     */
    @PostMapping("/{projectId}/commit")
    public ResponseEntity<Map<String, Object>> commitFile(
            @PathVariable Long projectId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "1") Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String headerUserName,
            @RequestHeader(value = "X-User-Email", required = false) String headerUserEmail,
            @Valid @RequestBody CommitFileRequest req) {

        if (req.getAuthorName() == null || req.getAuthorName().isBlank()) {
            req.setAuthorName(headerUserName != null ? headerUserName : "User " + userId);
        }
        if (req.getAuthorEmail() == null || req.getAuthorEmail().isBlank()) {
            req.setAuthorEmail(headerUserEmail != null ? headerUserEmail : "user" + userId + "@devcolab.local");
        }

        gitService.commitFile(projectId, userId, req);

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Committed successfully");
        resp.put("branch", req.getBranch());
        resp.put("path", req.getPath());
        return ResponseEntity.ok(resp);
    }

    /**
     * Compares two branches directly.
     */
    @GetMapping("/{projectId}/diff")
    public ResponseEntity<DiffResultDto> getBranchDiff(
            @PathVariable Long projectId,
            @RequestParam String sourceBranch,
            @RequestParam(required = false, defaultValue = "main") String targetBranch) {
        return ResponseEntity.ok(gitService.getDiff(projectId, sourceBranch, targetBranch));
    }

    /**
     * Creates a Pull Request.
     */
    @PostMapping("/{projectId}/pull-requests")
    public ResponseEntity<PullRequest> createPullRequest(
            @PathVariable Long projectId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "1") Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @Valid @RequestBody CreatePullRequestRequest req) {
        PullRequest pr = pullRequestService.createPullRequest(projectId, userId, userName, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(pr);
    }

    /**
     * Lists Pull Requests for a project.
     */
    @GetMapping("/{projectId}/pull-requests")
    public ResponseEntity<List<PullRequest>> getPullRequests(
            @PathVariable Long projectId,
            @RequestParam(required = false) PullRequestStatus status) {
        return ResponseEntity.ok(pullRequestService.getPullRequests(projectId, status));
    }

    /**
     * Gets a single Pull Request.
     */
    @GetMapping("/{projectId}/pull-requests/{prId}")
    public ResponseEntity<PullRequest> getPullRequest(
            @PathVariable Long projectId,
            @PathVariable Long prId) {
        return ResponseEntity.ok(pullRequestService.getPullRequest(projectId, prId));
    }

    /**
     * Gets diff for a Pull Request.
     */
    @GetMapping("/{projectId}/pull-requests/{prId}/diff")
    public ResponseEntity<DiffResultDto> getPullRequestDiff(
            @PathVariable Long projectId,
            @PathVariable Long prId) {
        return ResponseEntity.ok(pullRequestService.getPullRequestDiff(projectId, prId));
    }

    /**
     * Merges a Pull Request into target branch.
     */
    @PostMapping("/{projectId}/pull-requests/{prId}/merge")
    public ResponseEntity<PullRequest> mergePullRequest(
            @PathVariable Long projectId,
            @PathVariable Long prId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "1") Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        PullRequest mergedPr = pullRequestService.mergePullRequest(projectId, prId, userId, userName, userEmail);
        return ResponseEntity.ok(mergedPr);
    }

    /**
     * Closes a Pull Request without merging.
     */
    @PostMapping("/{projectId}/pull-requests/{prId}/close")
    public ResponseEntity<PullRequest> closePullRequest(
            @PathVariable Long projectId,
            @PathVariable Long prId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "1") Long userId) {
        PullRequest closedPr = pullRequestService.closePullRequest(projectId, prId, userId);
        return ResponseEntity.ok(closedPr);
    }
}
