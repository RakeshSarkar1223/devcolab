package com.devcolab.user.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRequest {

    @NotBlank(message = "Name is required")
    @JsonProperty("name")
    @JsonAlias({"Name"})
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @JsonProperty("email")
    @JsonAlias({"Email"})
    private String email;

    @JsonProperty("bio")
    @JsonAlias({"Bio"})
    private String bio;

    @JsonProperty("skills")
    @JsonAlias({"Skills"})
    private String skills;

    @JsonProperty("college")
    @JsonAlias({"College"})
    private String college;

    @JsonProperty("department")
    @JsonAlias({"Department"})
    private String department;

    @JsonProperty("social_links")
    @JsonAlias({"socialLinks", "social_links", "Social links", "SocialLinks"})
    private String socialLinks;

    @JsonProperty("avatar_link")
    @JsonAlias({"avatarLink", "avatar_link", "avatar", "avatarUrl", "Avatar link"})
    private String avatarLink;
}
