package com.lendit.lendit_backend.service;

import org.springframework.stereotype.Service;

import com.lendit.lendit_backend.dto.UserProfileResponse;
import com.lendit.lendit_backend.entity.RiskScore;
import com.lendit.lendit_backend.entity.User;
import com.lendit.lendit_backend.repository.ReviewRepository;
import com.lendit.lendit_backend.repository.RiskScoreRepository;
import com.lendit.lendit_backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService 
{

    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final RiskScoreRepository riskScoreRepository;

    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Double avgRating = reviewRepository.findAverageRatingByRevieweeId(userId);
        RiskScore riskScore = riskScoreRepository.findByUserId(userId).orElse(null);

        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .city(user.getCity())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .averageRating(avgRating != null ? avgRating : 0.0)
                .riskClassification(riskScore != null ? riskScore.getClassification().name() : "LOW")
                .riskScore(riskScore != null ? riskScore.getScore() : 0.0)
                .build();
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
