package com.devcolab.auth.kafka;

import com.devcolab.auth.event.UserCreatedEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {
    private final KafkaTemplate<String, UserCreatedEvent> kafkaTemplate;

    public KafkaProducerService(KafkaTemplate<String, UserCreatedEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishUserCreated(UserCreatedEvent event) {
        kafkaTemplate.send("user-created", event);
    }
}
