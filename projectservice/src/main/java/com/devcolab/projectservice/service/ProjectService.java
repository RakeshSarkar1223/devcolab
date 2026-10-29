package com.devcolab.projectservice.service;

import com.devcolab.projectservice.dto.ProjectMemberRequest;
import com.devcolab.projectservice.dto.ProjectRequest;
import com.devcolab.projectservice.dto.ProjectResponse;
import com.devcolab.projectservice.dto.UpdateMemberRequest;
import com.devcolab.projectservice.exception.ResourceNotFoundException;
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

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

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

        return savedProject;
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    public ProjectResponse getProjectWithMembers(Long id) {
        Project project = getProjectById(id);
        List<ProjectMember> members = projectMemberRepository.findByProjectId(id);
        return ProjectResponse.fromProject(project, members);
    }

    public List<Project> getProjectsByOwnerId(Long ownerId) {
        return projectRepository.findByOwnerId(ownerId);
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
        Project project = getProjectById(id);
        projectMemberRepository.deleteByProjectId(project.getId());
        projectRepository.delete(project);
    }

    // ==========================================
    // ProjectMember CRUD
    // ==========================================

    @Transactional
    public ProjectMember addMember(Long projectId, ProjectMemberRequest request) {
        // Ensure project exists
        getProjectById(projectId);

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, request.getUserId())) {
            throw new IllegalArgumentException("User with id " + request.getUserId() + " is already a member of project id " + projectId);
        }

        ProjectMember member = ProjectMember.builder()
                .projectId(projectId)
                .userId(request.getUserId())
                .role(request.getRole())
                .status(request.getStatus() != null ? request.getStatus() : MemberStatus.ACTIVE)
                .build();

        return projectMemberRepository.save(member);
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
}
