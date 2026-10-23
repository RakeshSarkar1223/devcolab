package com.devcolab.user.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    @JsonProperty("name")
    @JsonAlias({"Name"})
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column(nullable = false, unique = true)
    @JsonProperty("email")
    @JsonAlias({"Email"})
    private String email;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("bio")
    @JsonAlias({"Bio"})
    private String bio;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("skills")
    @JsonAlias({"Skills"})
    private String skills;

    @JsonProperty("college")
    @JsonAlias({"College"})
    private String college;

    @JsonProperty("department")
    @JsonAlias({"Department"})
    private String department;

    @Column(name = "social_links", columnDefinition = "TEXT")
    @JsonProperty("social_links")
    @JsonAlias({"socialLinks", "social_links", "Social links", "SocialLinks"})
    private String socialLinks;

    @Column(name = "avatar_link")
    @JsonProperty("avatar_link")
    @JsonAlias({"avatarLink", "avatar_link", "avatar", "avatarUrl", "Avatar link"})
    private String avatarLink;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
}
