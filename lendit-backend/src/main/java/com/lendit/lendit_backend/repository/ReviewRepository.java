package com.lendit.lendit_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lendit.lendit_backend.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByRevieweeId(Long revieweeId);

    List<Review> findByReviewerId(Long reviewerId);

    Optional<Review> findByBookingIdAndReviewerId(Long bookingId, Long reviewerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewee.id = :userId")
    Double findAverageRatingByRevieweeId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.reviewee.id = :userId AND r.damageReport = true")
    Long countDamageReportsByRevieweeId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.reviewee.id = :userId AND r.remarks IS NOT NULL AND r.remarks <> ''")
    Long countComplaintsByRevieweeId(@Param("userId") Long userId);
}
