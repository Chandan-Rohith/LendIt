package com.lendit.lendit_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lendit.lendit_backend.entity.RiskScore;
import com.lendit.lendit_backend.entity.RiskScore.RiskClassification;
import com.lendit.lendit_backend.entity.User;
import com.lendit.lendit_backend.repository.ReviewRepository;
import com.lendit.lendit_backend.repository.RiskScoreRepository;
import com.lendit.lendit_backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RiskScoreService {

    private final ReviewRepository reviewRepository;
    private final RiskScoreRepository riskScoreRepository;
    private final UserRepository userRepository;

    @Transactional
    public void calculateRiskScore(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Double avgRating = reviewRepository.findAverageRatingByRevieweeId(userId);
        Long damageCount = reviewRepository.countDamageReportsByRevieweeId(userId);
        Long complaintCount = reviewRepository.countComplaintsByRevieweeId(userId);

        if (avgRating == null) avgRating = 5.0;

        // Rule-based scoring
        // Score ranges from 0 (safest) to 100 (riskiest)
        double ratingScore = (5.0 - avgRating) * 20;   // 0-80 range
        double damageScore = Math.min(damageCount * 10, 50);   // 0-50 range
        double complaintScore = Math.min(complaintCount * 5, 30); // 0-30 range

        double rawScore = (ratingScore * 0.5) + (damageScore * 0.3) + (complaintScore * 0.2);
        rawScore = Math.min(100, Math.max(0, rawScore));

        // Logistic regression-inspired classification
        // Sigmoid function to map score to probability
        double z = (rawScore - 50) / 15;
        double probability = 1.0 / (1.0 + Math.exp(-z));

        RiskClassification classification;
        if (probability < 0.33) {
            classification = RiskClassification.LOW;
        } else if (probability < 0.66) {
            classification = RiskClassification.MEDIUM;
        } else {
            classification = RiskClassification.HIGH;
        }

        RiskScore riskScore = riskScoreRepository.findByUserId(userId)
                .orElse(RiskScore.builder().user(user).build());

        riskScore.setScore(Math.round(rawScore * 100.0) / 100.0);
        riskScore.setClassification(classification);

        riskScoreRepository.save(riskScore);
    }
}
