package com.devcolab.auth.kafka;

import com.devcolab.auth.event.UserDeletedEvent;
import com.devcolab.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class KafkaConsumerService {
    private final UserRepository userRepository;

    @Transactional
    @KafkaListener(topics = "user-deleted", groupId = "auth-group")
    public void consume(UserDeletedEvent event) {
        userRepository.findByEmail(event.getEmail()).ifPresent(user -> {
            userRepository.delete(user);
            System.out.println("User deleted successfully, email -> " + user.getEmail());
        });
    }
}
