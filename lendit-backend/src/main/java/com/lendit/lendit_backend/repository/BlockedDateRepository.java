package com.lendit.lendit_backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lendit.lendit_backend.entity.BlockedDate;

public interface BlockedDateRepository extends JpaRepository<BlockedDate, Long> {
    List<BlockedDate> findByToolId(Long toolId);
    void deleteByToolIdAndBlockedDate(Long toolId, LocalDate blockedDate);
    boolean existsByToolIdAndBlockedDate(Long toolId, LocalDate blockedDate);
}
