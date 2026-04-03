package com.lendit.lendit_backend.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lendit.lendit_backend.entity.RiskScore;
import com.lendit.lendit_backend.entity.RiskScore.RiskClassification;
import com.lendit.lendit_backend.entity.User;
import com.lendit.lendit_backend.repository.ReviewRepository;
import com.lendit.lendit_backend.repository.RiskScoreRepository;
import com.lendit.lendit_backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RiskScoreService 
{

    private final ReviewRepository reviewRepository;
    private final RiskScoreRepository riskScoreRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${ml.inference.enabled:true}")
    private boolean mlInferenceEnabled;

    @Value("${ml.inference.endpoint:}")
    private String mlInferenceEndpoint;

    @Value("${ml.inference.pythonExecutable:python}")
    private String pythonExecutable;

    @Value("${ml.inference.scriptPath:ml/infer.py}")
    private String inferenceScriptPath;

    @Transactional
    public void calculateRiskScore(Long userId) 
    {
        Long safeUserId = Objects.requireNonNull(userId, "userId is required");

        User user = userRepository.findById(safeUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FeatureSnapshot snapshot = getFeatureSnapshot(safeUserId);
        RiskComputationResult computed = computeWithFallback(snapshot);

        RiskScore riskScore = riskScoreRepository.findByUserId(safeUserId)
                .orElse(RiskScore.builder().user(user).build());

        riskScore.setScore(computed.score());
        riskScore.setClassification(computed.classification());

        riskScoreRepository.save(riskScore);
    }

    private FeatureSnapshot getFeatureSnapshot(Long userId) 
    {
        Double avgRating = reviewRepository.findAverageRatingByRevieweeId(userId);
        Long reviewCount = reviewRepository.countByRevieweeId(userId);
        Double avgDamage = reviewRepository.findAverageToolConditionByRevieweeId(userId);
        Double avgExperience = reviewRepository.findAverageExperienceByRevieweeId(userId);

        return new FeatureSnapshot(
            userId,
                avgRating != null ? avgRating : 5.0,
                reviewCount != null ? reviewCount : 0L,
                avgDamage != null ? avgDamage : 0.0,
                avgExperience != null ? avgExperience : 1.0
        );
    }

    private RiskComputationResult computeWithFallback(FeatureSnapshot snapshot) 
    {
        if (mlInferenceEnabled) 
        {
            // Try HTTP endpoint first (for separate ML service)
            if (mlInferenceEndpoint != null && !mlInferenceEndpoint.isBlank()) 
            {
                RiskComputationResult httpResult = invokeHttpInference(snapshot);
                if (httpResult != null) 
                {
                    return httpResult;
                }
            }

            // Fall back to local Python subprocess
            RiskComputationResult mlResult = invokePythonInference(snapshot);
            if (mlResult != null) 
            {
                return mlResult;
            }
        }

        return computeRuleBased(snapshot);
    }

    private RiskComputationResult invokeHttpInference(FeatureSnapshot snapshot) 
    {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("avg_rating", snapshot.avgRating());
            requestBody.put("review_count", snapshot.reviewCount());
            requestBody.put("avg_damage", snapshot.avgDamage());
            requestBody.put("avg_experience", snapshot.avgExperience());

            String endpoint = mlInferenceEndpoint.replaceAll("/+$", "") + "/api/ml/risk-score";
            
            org.springframework.http.ResponseEntity<Map> response = restTemplate.postForEntity(
                endpoint,
                requestBody,
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) 
            {
                Map<String, Object> body = response.getBody();
                Map<String, Object> output = (Map<String, Object>) body.get("output");
                
                if (output != null) 
                {
                    double score = ((Number) output.get("risk_score")).doubleValue();
                    String classificationRaw = (String) output.get("risk_classification");
                    
                    if (!Double.isNaN(score) && classificationRaw != null && !classificationRaw.isBlank()) 
                    {
                        RiskClassification classification = RiskClassification.valueOf(classificationRaw.toUpperCase(Locale.ROOT));
                        return new RiskComputationResult(round2(score), classification);
                    }
                }
            }
        } 
        catch (RestClientException | ClassCastException | NullPointerException ignored) 
        {
            // Silently fail; will fall back to Python or rule-based
        }
        return null;
    }

    private RiskComputationResult invokePythonInference(FeatureSnapshot snapshot) 
    {
        try {
            Path scriptPath = Paths.get(inferenceScriptPath);
            if (!scriptPath.isAbsolute()) 
            {
                scriptPath = Paths.get(System.getProperty("user.dir")).resolve(inferenceScriptPath).normalize();
            }

            if (!Files.exists(scriptPath)) 
            {
                return null;
            }

            List<String> command = new ArrayList<>();
            command.add(pythonExecutable);
            command.add(scriptPath.toString());
            command.add("--avg_rating");
            command.add(formatDouble(snapshot.avgRating()));
            command.add("--review_count");
            command.add(String.valueOf(snapshot.reviewCount()));
            command.add("--avg_damage");
            command.add(formatDouble(snapshot.avgDamage()));
            command.add("--avg_experience");
            command.add(formatDouble(snapshot.avgExperience()));

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(scriptPath.getParent().toFile());

            Process process = pb.start();

            String stdout;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) 
            {
                stdout = reader.lines().reduce("", (a, b) -> a + b);
            }

            String stderr;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) 
            {
                stderr = reader.lines().reduce("", (a, b) -> a + b);
            }

            int exit = process.waitFor();
            if (exit != 0 && !stderr.isBlank()) 
            {
                return null;
            }

            if (exit != 0 || stdout.isBlank()) 
            {
                return null;
            }

            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(stdout);
            JsonNode output = root.path("output");

            if (output.isMissingNode()) 
            {
                return null;
            }

            double score = output.path("risk_score").asDouble(Double.NaN);
            String classificationRaw = output.path("risk_classification").asText("");

            if (Double.isNaN(score) || classificationRaw.isBlank()) 
            {
                return null;
            }

            RiskClassification classification = RiskClassification.valueOf(classificationRaw.toUpperCase(Locale.ROOT));
            return new RiskComputationResult(round2(score), classification);
        } 
        catch (InterruptedException ignored) 
        {
            Thread.currentThread().interrupt();
            return null;
        } 
        catch (IOException | IllegalArgumentException ignored) 
        {
            return null;
        }
    }

    private RiskComputationResult computeRuleBased(FeatureSnapshot snapshot) 
    {
        Long damageCount = reviewRepository
                .countByRevieweeIdAndToolConditionGreaterThan(snapshot.revieweeId(), 1);

        Long complaintCount = reviewRepository
                .countByRevieweeIdAndExperienceGreaterThan(snapshot.revieweeId(), 1);

        if (damageCount == null) damageCount = 0L;
        if (complaintCount == null) complaintCount = 0L;

        // Rule-based scoring (0 = safe, 100 = risky)
        double ratingScore = (5.0 - snapshot.avgRating()) * 20;          // 0-80
        double damageScore = Math.min(damageCount * 10, 50);  // 0–50
        double complaintScore = Math.min(complaintCount * 5, 30); // 0–30

        double rawScore = (ratingScore * 0.5)
                        + (damageScore * 0.3)
                        + (complaintScore * 0.2);

        rawScore = Math.min(100, Math.max(0, rawScore));

        // Sigmoid classification (smooth boundary)
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

        return new RiskComputationResult(round2(rawScore), classification);
    }

    private String formatDouble(Double value) 
    {
        return String.format(Locale.US, "%.6f", value);
    }

    private double round2(double value) 
    {
        return Math.round(value * 100.0) / 100.0;
    }

    private record FeatureSnapshot(Long revieweeId, Double avgRating, Long reviewCount, Double avgDamage, Double avgExperience) 
    {
    }

    private record RiskComputationResult(Double score, RiskClassification classification) 
    {
    }
}