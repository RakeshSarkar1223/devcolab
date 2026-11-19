package com.devcolab.projectservice.repository;

import com.devcolab.projectservice.model.Project;
import com.devcolab.projectservice.model.Visibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerId(Long ownerId);
    List<Project> findByVisibility(Visibility visibility);
    boolean existsByNameAndOwnerId(String name, Long ownerId);
}
