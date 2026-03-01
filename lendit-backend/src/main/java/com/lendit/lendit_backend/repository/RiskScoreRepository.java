package com.lendit.lendit_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lendit.lendit_backend.entity.RiskScore;

public interface RiskScoreRepository extends JpaRepository<RiskScore, Long> {
    Optional<RiskScore> findByUserId(Long userId);
}
