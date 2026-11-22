package com.devcolab.projectservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {
    @Bean
    public NewTopic projectInvitationTopic() {
        return TopicBuilder.name("project-invitations")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic invitationResponseTopic() {
        return TopicBuilder.name("invitation-response")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic projectCreatedTopic() {
        return TopicBuilder.name("project-created")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic projectDeletedTopic() {
        return TopicBuilder.name("project-deleted")
                .partitions(3)
                .replicas(1)
                .build();
    }


}
