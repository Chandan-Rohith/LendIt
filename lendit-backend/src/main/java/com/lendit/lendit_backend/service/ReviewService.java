package com.lendit.lendit_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lendit.lendit_backend.dto.ReviewRequest;
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
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RiskScoreService riskScoreService;

    @Transactional
    public void submitReview(ReviewRequest request, Long reviewerId) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new RuntimeException("Can only review accepted bookings");
        }

        // Check if already reviewed
        if (reviewRepository.findByBookingIdAndReviewerId(request.getBookingId(), reviewerId).isPresent()) {
            throw new RuntimeException("You have already reviewed this booking");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Determine reviewee: if reviewer is borrower, reviewee is owner and vice versa
        Long revieweeId;
        if (booking.getBorrower().getId().equals(reviewerId)) {
            revieweeId = booking.getTool().getOwner().getId();
        } else if (booking.getTool().getOwner().getId().equals(reviewerId)) {
            revieweeId = booking.getBorrower().getId();
        } else {
            throw new RuntimeException("You are not part of this booking");
        }

        User reviewee = userRepository.findById(revieweeId)
                .orElseThrow(() -> new RuntimeException("Reviewee not found"));

        Review review = Review.builder()
                .booking(booking)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(request.getRating())
                .damageReport(request.getDamageReport())
                .complaintFlag(request.getComplaintFlag())
                .remarks(request.getRemarks())
                .build();

        reviewRepository.save(review);

        // Recalculate risk score for reviewee
        riskScoreService.calculateRiskScore(revieweeId);
    }
}
