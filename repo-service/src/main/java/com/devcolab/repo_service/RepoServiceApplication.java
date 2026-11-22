package com.devcolab.repo_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@EnableKafka
@SpringBootApplication
public class RepoServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(RepoServiceApplication.class, args);
	}

}
