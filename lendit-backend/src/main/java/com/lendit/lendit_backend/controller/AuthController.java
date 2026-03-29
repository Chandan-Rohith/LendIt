package com.lendit.lendit_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lendit.lendit_backend.dto.AuthResponse;
import com.lendit.lendit_backend.dto.LoginRequest;
import com.lendit.lendit_backend.dto.RegisterRequest;
import com.lendit.lendit_backend.dto.TestRegisterRequest;
import com.lendit.lendit_backend.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController 
{

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) 
    {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) 
    {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register-test")
    public ResponseEntity<AuthResponse> registerTest(@Valid @RequestBody TestRegisterRequest request) 
    {
        return ResponseEntity.ok(authService.registerTest(request));
    }
}
