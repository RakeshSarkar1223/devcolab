package com.devcolab.repo_service.repository;

import com.devcolab.repo_service.model.PullRequest;
import com.devcolab.repo_service.model.PullRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PullRequestRepository extends JpaRepository<PullRequest, Long> {

    List<PullRequest> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<PullRequest> findByProjectIdAndStatusOrderByCreatedAtDesc(Long projectId, PullRequestStatus status);

    Optional<PullRequest> findByIdAndProjectId(Long id, Long projectId);
}
