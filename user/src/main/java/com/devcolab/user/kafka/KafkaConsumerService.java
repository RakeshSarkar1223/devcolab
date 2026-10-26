package com.devcolab.user.kafka;

import com.devcolab.user.event.UserCreatedEvent;
import com.devcolab.user.model.User;
import com.devcolab.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KafkaConsumerService {
    private final UserRepository userRepository;

    @KafkaListener(topics = "user-created", groupId = "user-group")
    public void consume(UserCreatedEvent event){
        User user = User.builder().email(event.getEmail()).build();
        userRepository.save(user);
        System.out.println("User registered successfully, email -> " + user.getEmail());
    }
}
