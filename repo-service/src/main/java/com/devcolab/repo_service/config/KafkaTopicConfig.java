package com.devcolab.repo_service.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic pullRequestTopic() {
        return TopicBuilder.name("pull-request-events")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic repoEventsTopic() {
        return TopicBuilder.name("repo-events")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
