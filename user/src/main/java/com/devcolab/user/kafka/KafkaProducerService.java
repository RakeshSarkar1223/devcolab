package com.devcolab.user.kafka;

import com.devcolab.user.event.UserDeletedEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {
    private final KafkaTemplate<String, UserDeletedEvent> kafkaTemplate;

    public KafkaProducerService(KafkaTemplate<String, UserDeletedEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishUserDeleted(UserDeletedEvent event) {
        kafkaTemplate.send("user-deleted", event);
    }
}
