package com.lendit.lendit_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lendit.lendit_backend.dto.ReviewRequest;
import com.lendit.lendit_backend.dto.ReviewResponse;
import com.lendit.lendit_backend.entity.Booking;
import com.lendit.lendit_backend.entity.Booking.BookingStatus;
import com.lendit.lendit_backend.entity.Review;
import com.lendit.lendit_backend.entity.User;
import com.lendit.lendit_backend.repository.BookingRepository;
import com.lendit.lendit_backend.repository.ReviewRepository;
import com.lendit.lendit_backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService 
{

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RiskScoreService riskScoreService;

    @Transactional
    public void submitReview(ReviewRequest request, Long reviewerId) 
    {

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.COMPLETED) 
        {
            throw new RuntimeException("Can only review completed bookings");
        }

        // Prevent duplicate review
        if (reviewRepository.findByBookingIdAndReviewerId(request.getBookingId(), reviewerId).isPresent()) 
        {
            throw new RuntimeException("You have already reviewed this booking");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Determine reviewee
        Long revieweeId;
        if (booking.getBorrower().getId().equals(reviewerId)) 
        {
            revieweeId = booking.getTool().getOwner().getId();
        } 
        else if (booking.getTool().getOwner().getId().equals(reviewerId)) 
        {
            revieweeId = booking.getBorrower().getId();
        } 
        else 
        {
            throw new RuntimeException("You are not part of this booking");
        }

        User reviewee = userRepository.findById(revieweeId)
                .orElseThrow(() -> new RuntimeException("Reviewee not found"));

        // Resolve values (snake_case preferred)
        Integer resolvedToolCondition = request.getDamageScore() != null
                ? request.getDamageScore()
                : request.getToolCondition();

        Integer resolvedExperience = request.getExperienceScore() != null
                ? request.getExperienceScore()
                : request.getExperience();

        //VALIDATIONS (IMPORTANT)
        if (resolvedToolCondition == null) 
        {
            throw new RuntimeException("Tool condition is required");
        }

        if (resolvedExperience == null) 
        {
            throw new RuntimeException("Experience is required");
        }

        if (resolvedToolCondition < 0 || resolvedToolCondition > 3) 
        {
            throw new RuntimeException("Invalid tool condition value (0-3 allowed)");
        }

        if (resolvedExperience < 0 || resolvedExperience > 3) 
        {
            throw new RuntimeException("Invalid experience value (0-3 allowed)");
        }

        // Build review
        Review review = Review.builder()
                .booking(booking)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(request.getRating())
                .toolCondition(resolvedToolCondition)
                .experience(resolvedExperience)
                .remarks(request.getRemarks())
                .build();

        reviewRepository.save(review);

        // Update risk score
        riskScoreService.calculateRiskScore(revieweeId);
    }

    public java.util.List<ReviewResponse> getReviewsByBooking(Long bookingId) 
    {
        return reviewRepository.findByBookingId(bookingId).stream()
                .filter(this::isBorrowerReview)
                .map(this::mapToResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    public java.util.List<ReviewResponse> getReviewsByTool(Long toolId) 
    {
        return reviewRepository.findByToolId(toolId).stream()
                .filter(this::isBorrowerReview)
                .map(this::mapToResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    private boolean isBorrowerReview(Review review) 
    {
        return review.getReviewer().getId().equals(review.getBooking().getBorrower().getId());
    }

    private ReviewResponse mapToResponse(Review review) 
    {
        return ReviewResponse.builder()
                .id(review.getId())
                .bookingId(review.getBooking().getId())
                .reviewerName(review.getReviewer().getFullName())
                .reviewerId(review.getReviewer().getId())
                .revieweeName(review.getReviewee().getFullName())
                .revieweeId(review.getReviewee().getId())
                .rating(review.getRating())
                .toolCondition(review.getToolCondition())
                .experience(review.getExperience())
                .remarks(review.getRemarks())
                .createdAt(review.getCreatedAt())
                .build();
    }
}