package com.lendit.lendit_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LenditBackendApplication 
{

	public static void main(String[] args) 
	{
		SpringApplication.run(LenditBackendApplication.class, args);
	}

}
