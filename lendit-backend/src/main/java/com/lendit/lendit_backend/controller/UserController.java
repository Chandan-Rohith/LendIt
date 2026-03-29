package com.lendit.lendit_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lendit.lendit_backend.dto.UpdateContactInfoRequest;
import com.lendit.lendit_backend.dto.UpdateLocationRequest;
import com.lendit.lendit_backend.dto.UserProfileResponse;
import com.lendit.lendit_backend.security.JwtUtil;
import com.lendit.lendit_backend.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController 
{

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(@RequestHeader("Authorization") String authHeader) 
    {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable Long userId) 
    {
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @PatchMapping("/location")
    public ResponseEntity<UserProfileResponse> updateMyLocation(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody UpdateLocationRequest request) 
    {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(userService.updateLocation(userId, request));
    }

    @PatchMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateMyContactInfo(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody UpdateContactInfoRequest request) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(userService.updateContactInfo(userId, request));
    }

    private Long extractUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        return jwtUtil.extractUserId(token);
    }
}
