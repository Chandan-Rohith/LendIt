package com.lendit.lendit_backend.config;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.lendit.lendit_backend.entity.Category;
import com.lendit.lendit_backend.entity.Tool;
import com.lendit.lendit_backend.repository.CategoryRepository;
import com.lendit.lendit_backend.repository.ToolRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ToolRepository toolRepository;

    private static final List<String> REQUIRED_CATEGORIES = List.of(
            "Power Tools",
            "Hand Tools",
            "Garden",
            "Automotive",
            "Home & Cleaning"
    );

    private static final Map<String, String> LEGACY_CATEGORY_MAPPING = Map.of(
            "Automotive Tools", "Automotive",
            "Construction Tools", "Hand Tools",
            "Electrical Tools", "Hand Tools",
            "Garden Tools", "Garden",
            "Cleaning Tools", "Home & Cleaning",
            "Miscellaneous", "Hand Tools"
    );

    @Override
    @Transactional
    public void run(String... args) {
        Map<String, Category> categoriesByName = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getName, Function.identity(), (first, second) -> first));

        for (String categoryName : REQUIRED_CATEGORIES) {
            categoriesByName.computeIfAbsent(categoryName,
                    name -> categoryRepository.save(Category.builder().name(name).build()));
        }

        categoriesByName = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getName, Function.identity(), (first, second) -> first));

        Set<String> requiredSet = Set.copyOf(REQUIRED_CATEGORIES);
        Category defaultCategory = categoriesByName.get("Hand Tools");

        for (Category category : categoryRepository.findAll()) {
            if (requiredSet.contains(category.getName())) {
                continue;
            }

            String mappedName = LEGACY_CATEGORY_MAPPING.getOrDefault(category.getName(), "Hand Tools");
            Category targetCategory = categoriesByName.getOrDefault(mappedName, defaultCategory);

            List<Tool> toolsToMove = toolRepository.findByCategoryId(category.getId());
            if (!toolsToMove.isEmpty()) {
                toolsToMove.forEach(tool -> tool.setCategory(targetCategory));
                toolRepository.saveAll(toolsToMove);
            }

            categoryRepository.delete(category);
        }

        System.out.println("✅ Categories synchronized to required list.");
    }
}
