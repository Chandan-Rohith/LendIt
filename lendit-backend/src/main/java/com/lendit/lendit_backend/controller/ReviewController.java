package com.lendit.lendit_backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lendit.lendit_backend.dto.ReviewRequest;
import com.lendit.lendit_backend.dto.ReviewResponse;
import com.lendit.lendit_backend.security.JwtUtil;
import com.lendit.lendit_backend.service.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController 
{

    private final ReviewService reviewService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<String> submitReview(
            @Valid @RequestBody ReviewRequest request,
            @RequestHeader("Authorization") String authHeader) 
            {
        Long userId = extractUserId(authHeader);
        reviewService.submitReview(request, userId);
        return ResponseEntity.ok("Review submitted successfully");
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(reviewService.getReviewsByBooking(bookingId));
    }

    @GetMapping("/tool/{toolId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByTool(@PathVariable Long toolId) {
        return ResponseEntity.ok(reviewService.getReviewsByTool(toolId));
    }

    private Long extractUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        return jwtUtil.extractUserId(token);
    }
}
