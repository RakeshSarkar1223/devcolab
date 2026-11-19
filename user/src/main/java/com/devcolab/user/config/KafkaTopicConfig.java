package com.devcolab.user.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;


@Configuration
public class KafkaTopicConfig {
    @Bean
    public NewTopic userDeletionTopic() {
        return TopicBuilder.name("user-deleted")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
