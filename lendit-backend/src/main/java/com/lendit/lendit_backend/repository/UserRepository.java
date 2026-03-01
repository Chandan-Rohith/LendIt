package com.lendit.lendit_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lendit.lendit_backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> 
{
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
}
