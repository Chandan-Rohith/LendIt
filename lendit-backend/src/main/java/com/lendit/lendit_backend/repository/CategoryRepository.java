package com.lendit.lendit_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lendit.lendit_backend.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> 
{
    Optional<Category> findByName(String name);
}
