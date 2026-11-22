package com.devcolab.projectservice.service;

import com.devcolab.projectservice.dto.ProjectMemberRequest;
import com.devcolab.projectservice.dto.ProjectRequest;
import com.devcolab.projectservice.dto.ProjectResponse;
import com.devcolab.projectservice.dto.UpdateMemberRequest;
import com.devcolab.projectservice.event.InvitationResponseEvent;
import com.devcolab.projectservice.event.ProjectCreatedEvent;
import com.devcolab.projectservice.event.ProjectDeletedEvent;
import com.devcolab.projectservice.event.ProjectInvitationEvent;
import com.devcolab.projectservice.exception.ForbiddenException;
import com.devcolab.projectservice.exception.ResourceNotFoundException;
import com.devcolab.projectservice.kafka.ProjectEventPublisher;
import com.devcolab.projectservice.model.MemberStatus;
import com.devcolab.projectservice.model.Project;
import com.devcolab.projectservice.model.ProjectMember;
import com.devcolab.projectservice.model.Role;
import com.devcolab.projectservice.model.Visibility;
import com.devcolab.projectservice.repository.ProjectMemberRepository;
import com.devcolab.projectservice.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    private final ProjectEventPublisher publisher;
    // ==========================================
    // Project CRUD
    // ==========================================

    @Transactional
    public Project createProject(ProjectRequest request) {
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .ownerId(request.getOwnerId())
                .visibility(request.getVisibility() != null ? request.getVisibility() : Visibility.PUBLIC)
                .build();

        Project savedProject = projectRepository.save(project);

        // Automatically assign the owner as a project member with OWNER role
        ProjectMember ownerMember = ProjectMember.builder()
                .projectId(savedProject.getId())
                .userId(savedProject.getOwnerId())
                .role(Role.OWNER)
                .status(MemberStatus.ACTIVE)
                .build();

        projectMemberRepository.save(ownerMember);

        // Publish ProjectCreatedEvent for auto-creating git repository in repo-service
        publisher.publishProjectCreated(ProjectCreatedEvent.builder()
                .projectId(savedProject.getId())
                .projectName(savedProject.getName())
                .ownerId(savedProject.getOwnerId())
                .createdAt(LocalDateTime.now())
                .build());

        return savedProject;
    }

    public boolean isUserProjectMemberOrOwner(Project project, Long userId) {
        if (userId == null) {
            return false;
        }
        if (project.getOwnerId() != null && project.getOwnerId().equals(userId)) {
            return true;
        }
        return projectMemberRepository.existsByProjectIdAndUserId(project.getId(), userId);
    }

    public List<Project> getAllProjects(Long userId) {
        if (userId == null) {
            return projectRepository.findByVisibility(Visibility.PUBLIC);
        }

        List<Long> memberProjectIds = projectMemberRepository.findByUserId(userId)
                .stream()
                .map(ProjectMember::getProjectId)
                .distinct()
                .toList();

        return projectRepository.findAll().stream()
                .filter(p -> p.getVisibility() == Visibility.PUBLIC
                        || (p.getOwnerId() != null && p.getOwnerId().equals(userId))
                        || memberProjectIds.contains(p.getId()))
                .toList();
    }

    public List<Project> getAllProjects() {
        return getAllProjects(null);
    }

    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    public Project getProjectById(Long id, Long userId) {
        Project project = getProjectById(id);
        if (project.getVisibility() == Visibility.PRIVATE && !isUserProjectMemberOrOwner(project, userId)) {
            throw new ForbiddenException("Access denied: Project #" + id + " is private and only visible to project members");
        }
        return project;
    }

    public ProjectResponse getProjectWithMembers(Long id, Long userId) {
        Project project = getProjectById(id, userId);
        List<ProjectMember> members = projectMemberRepository.findByProjectId(id);
        return ProjectResponse.fromProject(project, members);
    }

    public ProjectResponse getProjectWithMembers(Long id) {
        return getProjectWithMembers(id, null);
    }

    public List<Project> getProjectsByOwnerId(Long ownerId, Long userId) {
        List<Project> ownerProjects = projectRepository.findByOwnerId(ownerId);
        if (userId != null && userId.equals(ownerId)) {
            return ownerProjects;
        }
        return ownerProjects.stream()
                .filter(p -> p.getVisibility() == Visibility.PUBLIC || isUserProjectMemberOrOwner(p, userId))
                .toList();
    }

    public List<Project> getProjectsByOwnerId(Long ownerId) {
        return getProjectsByOwnerId(ownerId, null);
    }

    public List<Project> getProjectsByUserId(Long userId) {
        List<ProjectMember> memberships = projectMemberRepository.findByUserId(userId);
        List<Long> projectIds = memberships.stream()
                .map(ProjectMember::getProjectId)
                .distinct()
                .toList();

        return projectRepository.findAllById(projectIds);
    }

    @Transactional
    public Project updateProject(Long id, ProjectRequest request) {
        Project project = getProjectById(id);

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        if (request.getVisibility() != null) {
            project.setVisibility(request.getVisibility());
        }

        return projectRepository.save(project);
    }

    @Transactional
    public void deleteProject(Long id) {
        deleteProject(id, null);
    }

    @Transactional
    public void deleteProject(Long id, Long userId) {
        Project project = getProjectById(id);

        if (userId != null && !project.getOwnerId().equals(userId)) {
            throw new ForbiddenException("Only the project owner can delete this project.");
        }

        // Fetch all members before deleting to notify them
        List<ProjectMember> members = projectMemberRepository.findByProjectId(project.getId());
        List<Long> memberUserIds = members.stream()
                .map(ProjectMember::getUserId)
                .filter(uid -> !uid.equals(project.getOwnerId()))
                .distinct()
                .toList();

        // Publish deletion event so notification service can alert all members
        publisher.publishProjectDeleted(ProjectDeletedEvent.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .ownerId(project.getOwnerId())
                .memberUserIds(memberUserIds)
                .timestamp(LocalDateTime.now())
                .build());

        projectMemberRepository.deleteByProjectId(project.getId());
        projectRepository.delete(project);
    }

    // ==========================================
    // ProjectMember CRUD
    // ==========================================

    @Transactional
    public ProjectMember addMember(Long projectId, ProjectMemberRequest request) {
        // Ensure project exists
        Project project = getProjectById(projectId);

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, request.getUserId())) {
            throw new IllegalArgumentException("User with id " + request.getUserId() + " is already a member of project id " + projectId);
        }

        MemberStatus initialStatus = request.getStatus() != null ? request.getStatus() : MemberStatus.PENDING;

        ProjectMember member = ProjectMember.builder()
                .projectId(projectId)
                .userId(request.getUserId())
                .role(request.getRole())
                .status(initialStatus)
                .build();

        ProjectMember savedMember = projectMemberRepository.save(member);

        ProjectInvitationEvent event = ProjectInvitationEvent.builder()
                .receiverId(request.getUserId())
                .projectName(project.getName())
                .role(request.getRole())
                .senderName(request.getSenderName())
                .projectId(projectId)
                .build();

        publisher.publish(event);

        return savedMember;
    }

    public List<ProjectMember> getProjectMembers(Long projectId) {
        getProjectById(projectId);
        return projectMemberRepository.findByProjectId(projectId);
    }

    public ProjectMember getProjectMember(Long projectId, Long memberId) {
        getProjectById(projectId);

        ProjectMember member = projectMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Project member not found with id: " + memberId));

        if (!member.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("Member id " + memberId + " does not belong to project id " + projectId);
        }

        return member;
    }

    @Transactional
    public ProjectMember updateMember(Long projectId, Long memberId, UpdateMemberRequest request) {
        ProjectMember member = getProjectMember(projectId, memberId);

        if (request.getRole() != null) {
            member.setRole(request.getRole());
        }
        if (request.getStatus() != null) {
            member.setStatus(request.getStatus());
        }

        return projectMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(Long projectId, Long memberId) {
        ProjectMember member = getProjectMember(projectId, memberId);
        projectMemberRepository.delete(member);
    }

    @Transactional
    public ProjectMember acceptInvitation(Long projectId, Long userId) {
        Project project = getProjectById(projectId);
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found for project " + projectId + " and user " + userId));

        member.setStatus(MemberStatus.ACTIVE);
        ProjectMember savedMember = projectMemberRepository.save(member);

        InvitationResponseEvent event = InvitationResponseEvent.builder()
                .receiverId(project.getOwnerId())
                .responderId(userId)
                .projectId(projectId)
                .projectName(project.getName())
                .role(savedMember.getRole())
                .accepted(true)
                .build();

        publisher.sendResponse(event);

        return savedMember;
    }

    @Transactional
    public void rejectInvitation(Long projectId, Long userId) {
        Project project = getProjectById(projectId);
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found for project " + projectId + " and user " + userId));

        Role role = member.getRole();
        projectMemberRepository.delete(member);

        InvitationResponseEvent event = InvitationResponseEvent.builder()
                .receiverId(project.getOwnerId())
                .responderId(userId)
                .projectId(projectId)
                .projectName(project.getName())
                .role(role)
                .accepted(false)
                .build();

        publisher.sendResponse(event);
    }
}
