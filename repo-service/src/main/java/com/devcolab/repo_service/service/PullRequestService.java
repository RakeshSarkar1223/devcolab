package com.devcolab.repo_service.service;

import com.devcolab.repo_service.dto.CreatePullRequestRequest;
import com.devcolab.repo_service.dto.DiffResultDto;
import com.devcolab.repo_service.event.PullRequestEvent;
import com.devcolab.repo_service.exception.GitOperationException;
import com.devcolab.repo_service.exception.ResourceNotFoundException;
import com.devcolab.repo_service.kafka.RepoEventPublisher;
import com.devcolab.repo_service.model.PullRequest;
import com.devcolab.repo_service.model.PullRequestStatus;
import com.devcolab.repo_service.repository.PullRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PullRequestService {

    private final PullRequestRepository pullRequestRepository;
    private final GitService gitService;
    private final RepoEventPublisher eventPublisher;

    @Transactional
    public PullRequest createPullRequest(Long projectId, Long userId, String userName, CreatePullRequestRequest req) {
        String targetBranch = (req.getTargetBranch() == null || req.getTargetBranch().isBlank())
                ? "main" : req.getTargetBranch().trim();
        String sourceBranch = req.getSourceBranch().trim();

        if (sourceBranch.equalsIgnoreCase(targetBranch)) {
            throw new GitOperationException("Source and target branches cannot be the same.");
        }

        // Verify diff and check conflicts
        DiffResultDto diff = gitService.getDiff(projectId, sourceBranch, targetBranch);

        PullRequest pr = PullRequest.builder()
                .projectId(projectId)
                .ownerId(req.getOwnerId())
                .title(req.getTitle())
                .description(req.getDescription())
                .sourceBranch(sourceBranch)
                .targetBranch(targetBranch)
                .authorId(userId)
                .authorName(userName != null ? userName : "User " + userId)
                .status(PullRequestStatus.OPEN)
                .hasConflicts(diff.isHasConflicts())
                .createdAt(LocalDateTime.now())
                .build();

        PullRequest savedPr = pullRequestRepository.save(pr);

        // Publish Kafka event
        eventPublisher.publishPullRequestEvent(PullRequestEvent.builder()
                .pullRequestId(savedPr.getId())
                .projectId(projectId)
                .ownerId(savedPr.getOwnerId())
                .title(savedPr.getTitle())
                .authorId(userId)
                .authorName(savedPr.getAuthorName())
                .sourceBranch(sourceBranch)
                .targetBranch(targetBranch)
                .eventType("CREATED")
                .timestamp(LocalDateTime.now())
                .build());

        return savedPr;
    }

    public List<PullRequest> getPullRequests(Long projectId, PullRequestStatus status) {
        if (status != null) {
            return pullRequestRepository.findByProjectIdAndStatusOrderByCreatedAtDesc(projectId, status);
        }
        return pullRequestRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    public PullRequest getPullRequest(Long projectId, Long prId) {
        return pullRequestRepository.findByIdAndProjectId(prId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Pull Request #" + prId + " not found for project " + projectId));
    }

    public DiffResultDto getPullRequestDiff(Long projectId, Long prId) {
        PullRequest pr = getPullRequest(projectId, prId);
        return gitService.getDiff(projectId, pr.getSourceBranch(), pr.getTargetBranch());
    }

    @Transactional
    public PullRequest mergePullRequest(Long projectId, Long prId, Long reviewerId, String reviewerName, String reviewerEmail) {
        PullRequest pr = getPullRequest(projectId, prId);

        if (pr.getStatus() != PullRequestStatus.OPEN) {
            throw new GitOperationException("Cannot merge a pull request that is already " + pr.getStatus());
        }

        // Perform 3-way merge in JGit
        String commitMsg = "Merge pull request #" + prId + " from " + pr.getSourceBranch() + "\n\n" + pr.getTitle();
        gitService.mergeBranches(projectId, pr.getSourceBranch(), pr.getTargetBranch(), commitMsg, reviewerId, reviewerName, reviewerEmail);

        pr.setStatus(PullRequestStatus.MERGED);
        pr.setMergedAt(LocalDateTime.now());
        pr.setMergedByUserId(reviewerId);
        PullRequest updatedPr = pullRequestRepository.save(pr);

        // Publish Kafka event
        eventPublisher.publishPullRequestEvent(PullRequestEvent.builder()
                .pullRequestId(updatedPr.getId())
                .projectId(projectId)
                .ownerId(pr.getOwnerId())
                .title(updatedPr.getTitle())
                .authorId(pr.getAuthorId())
                .authorName(pr.getAuthorName())
                .sourceBranch(pr.getSourceBranch())
                .targetBranch(pr.getTargetBranch())
                .eventType("MERGED")
                .timestamp(LocalDateTime.now())
                .build());

        return updatedPr;
    }

    @Transactional
    public PullRequest closePullRequest(Long projectId, Long prId, Long userId) {
        PullRequest pr = getPullRequest(projectId, prId);

        if (pr.getStatus() != PullRequestStatus.OPEN) {
            throw new GitOperationException("Pull Request is already " + pr.getStatus());
        }

        pr.setStatus(PullRequestStatus.CLOSED);
        PullRequest updatedPr = pullRequestRepository.save(pr);

        // Publish Kafka event
        eventPublisher.publishPullRequestEvent(PullRequestEvent.builder()
                .pullRequestId(updatedPr.getId())
                .projectId(projectId)
                .ownerId(pr.getOwnerId())
                .title(updatedPr.getTitle())
                .authorId(pr.getAuthorId())
                .authorName(pr.getAuthorName())
                .sourceBranch(pr.getSourceBranch())
                .targetBranch(pr.getTargetBranch())
                .eventType("CLOSED")
                .timestamp(LocalDateTime.now())
                .build());

        return updatedPr;
    }
}
