package com.lendit.lendit_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lendit.lendit_backend.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> 
{

    List<Review> findByRevieweeId(Long revieweeId);

    List<Review> findByReviewerId(Long reviewerId);

    Optional<Review> findByBookingIdAndReviewerId(Long bookingId, Long reviewerId);

    //Average rating
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewee.id = :userId")
    Double findAverageRatingByRevieweeId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.reviewee.id = :userId")
    Long countByRevieweeId(@Param("userId") Long userId);

    @Query("SELECT AVG(r.toolCondition) FROM Review r WHERE r.reviewee.id = :userId")
    Double findAverageToolConditionByRevieweeId(@Param("userId") Long userId);

    @Query("SELECT AVG(r.experience) FROM Review r WHERE r.reviewee.id = :userId")
    Double findAverageExperienceByRevieweeId(@Param("userId") Long userId);

    //Damage count (tool_condition > 1 → Minor/Major damage)
    Long countByRevieweeIdAndToolConditionGreaterThan(Long revieweeId, Integer value);

    //Complaint count (experience > 1 → Neutral/Problematic)
    Long countByRevieweeIdAndExperienceGreaterThan(Long revieweeId, Integer value);

    List<Review> findByBookingId(Long bookingId);

    @Query("SELECT r FROM Review r WHERE r.booking.tool.id = :toolId ORDER BY r.createdAt DESC")
    List<Review> findByToolId(@Param("toolId") Long toolId);
}