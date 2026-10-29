package com.devcolab.projectservice.controller;

import com.devcolab.projectservice.dto.ProjectMemberRequest;
import com.devcolab.projectservice.dto.ProjectRequest;
import com.devcolab.projectservice.dto.ProjectResponse;
import com.devcolab.projectservice.dto.UpdateMemberRequest;
import com.devcolab.projectservice.model.Project;
import com.devcolab.projectservice.model.ProjectMember;
import com.devcolab.projectservice.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping("/hello")
    public ResponseEntity<String> hello() {
        return ResponseEntity.ok("Hello from project service");
    }

    // ==========================================
    // Project Endpoints
    // ==========================================

    @PostMapping
    public ResponseEntity<Project> createProject(@Valid @RequestBody ProjectRequest request) {
        Project created = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<ProjectResponse> getProjectWithMembers(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectWithMembers(id));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Project>> getProjectsByOwnerId(@PathVariable Long ownerId) {
        return ResponseEntity.ok(projectService.getProjectsByOwnerId(ownerId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Project>> getProjectsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(projectService.getProjectsByUserId(userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // Project Member Endpoints
    // ==========================================

    @PostMapping("/{projectId}/members")
    public ResponseEntity<ProjectMember> addMember(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectMemberRequest request) {
        ProjectMember member = projectService.addMember(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(member);
    }

    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<ProjectMember>> getProjectMembers(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getProjectMembers(projectId));
    }

    @GetMapping("/{projectId}/members/{memberId}")
    public ResponseEntity<ProjectMember> getProjectMember(
            @PathVariable Long projectId,
            @PathVariable Long memberId) {
        return ResponseEntity.ok(projectService.getProjectMember(projectId, memberId));
    }

    @PutMapping("/{projectId}/members/{memberId}")
    public ResponseEntity<ProjectMember> updateMember(
            @PathVariable Long projectId,
            @PathVariable Long memberId,
            @RequestBody UpdateMemberRequest request) {
        return ResponseEntity.ok(projectService.updateMember(projectId, memberId, request));
    }

    @DeleteMapping("/{projectId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long projectId,
            @PathVariable Long memberId) {
        projectService.removeMember(projectId, memberId);
        return ResponseEntity.noContent().build();
    }
}
