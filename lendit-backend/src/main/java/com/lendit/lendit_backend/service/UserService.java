package com.lendit.lendit_backend.service;

import org.springframework.stereotype.Service;

import com.lendit.lendit_backend.dto.UpdateContactInfoRequest;
import com.lendit.lendit_backend.dto.UpdateLocationRequest;
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
                .address(user.getAddress())
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

    public UserProfileResponse updateLocation(Long userId, UpdateLocationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setLatitude(request.getLatitude());
        user.setLongitude(request.getLongitude());
        userRepository.save(user);

        return getProfile(userId);
    }

    public UserProfileResponse updateContactInfo(Long userId, UpdateContactInfoRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String nextEmail = request.getEmail().trim();
        if (!nextEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(nextEmail)) {
            throw new RuntimeException("Email already registered");
        }

        user.setEmail(nextEmail);
        user.setPhone(request.getPhone().trim());
        user.setCity(request.getCity().trim());
        user.setAddress(request.getAddress().trim());
        userRepository.save(user);

        return getProfile(userId);
    }
}
