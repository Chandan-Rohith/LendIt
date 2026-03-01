package com.lendit.lendit_backend.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.lendit.lendit_backend.entity.Category;
import com.lendit.lendit_backend.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() == 0) {
            List<Category> categories = List.of(
                    Category.builder().name("Power Tools").build(),
                    Category.builder().name("Garden Tools").build(),
                    Category.builder().name("Construction Tools").build(),
                    Category.builder().name("Cleaning Tools").build(),
                    Category.builder().name("Automotive Tools").build(),
                    Category.builder().name("Electrical Tools").build(),
                    Category.builder().name("Miscellaneous").build()
            );
            categoryRepository.saveAll(categories);
            System.out.println("✅ Categories seeded successfully!");
        }
    }
}
