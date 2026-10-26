package com.devcolab.user.service;

import com.devcolab.user.dto.UserRequest;
import com.devcolab.user.event.UserDeletedEvent;
import com.devcolab.user.exception.ResourceNotFoundException;
import com.devcolab.user.kafka.KafkaProducerService;
import com.devcolab.user.model.User;
import com.devcolab.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final KafkaProducerService kafkaProducerService;

    @Transactional
    public User createUser(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("User with email " + request.getEmail() + " already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .bio(request.getBio())
                .skills(request.getSkills())
                .college(request.getCollege())
                .department(request.getDepartment())
                .socialLinks(request.getSocialLinks())
                .avatarLink(request.getAvatarLink())
                .build();

        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public User updateUser(Long id, UserRequest request) {
        User existingUser = getUserById(id);

        if (!existingUser.getEmail().equalsIgnoreCase(request.getEmail()) &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email " + request.getEmail() + " is already in use by another user");
        }

        existingUser.setName(request.getName());
        existingUser.setEmail(request.getEmail());
        existingUser.setBio(request.getBio());
        existingUser.setSkills(request.getSkills());
        existingUser.setCollege(request.getCollege());
        existingUser.setDepartment(request.getDepartment());
        existingUser.setSocialLinks(request.getSocialLinks());
        existingUser.setAvatarLink(request.getAvatarLink());

        return userRepository.save(existingUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = getUserById(id);
        String email = user.getEmail();
        userRepository.delete(user);
        kafkaProducerService.publishUserDeleted(new UserDeletedEvent(email));
    }
}
