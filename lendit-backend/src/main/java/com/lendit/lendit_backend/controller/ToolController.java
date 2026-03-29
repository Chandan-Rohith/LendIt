package com.lendit.lendit_backend.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.lendit.lendit_backend.dto.ToolRequest;
import com.lendit.lendit_backend.dto.ToolResponse;
import com.lendit.lendit_backend.security.JwtUtil;
import com.lendit.lendit_backend.service.ToolService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tools")
@RequiredArgsConstructor
public class ToolController {

    private final ToolService toolService;
    private final JwtUtil jwtUtil;

    @PostMapping
        public ResponseEntity<ToolResponse> addTool(
                @RequestPart("tool") ToolRequest request,
                @RequestPart(value = "photo", required = false) MultipartFile photo,
                @RequestHeader("Authorization") String authHeader) {
            Long userId = extractUserId(authHeader);
            return ResponseEntity.ok(toolService.addTool(request, photo, userId));
        }

    @GetMapping
    public ResponseEntity<List<ToolResponse>> getToolsNearUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(toolService.getToolsNearUser(userId, lat, lng));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ToolResponse>> getToolsByCategory(
            @PathVariable Long categoryId,
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(toolService.getToolsByCategory(categoryId, userId, lat, lng));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ToolResponse>> searchTools(
            @RequestParam String keyword,
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(toolService.searchTools(keyword, userId, lat, lng));
    }

    @GetMapping("/{toolId}")
    public ResponseEntity<ToolResponse> getToolById(
            @PathVariable Long toolId,
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(toolService.getToolById(toolId, userId, lat, lng));
    }

    @GetMapping("/my-tools")
    public ResponseEntity<List<ToolResponse>> getMyTools(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(toolService.getMyTools(userId));
    }

    @DeleteMapping("/{toolId}")
    public ResponseEntity<Void> deleteTool(
            @PathVariable Long toolId,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        toolService.deleteTool(toolId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{toolId}/blocked-dates")
    public ResponseEntity<List<LocalDate>> getBlockedDates(@PathVariable Long toolId) {
        return ResponseEntity.ok(toolService.getBlockedDates(toolId));
    }

    private Long extractUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        return jwtUtil.extractUserId(token);
    }
}
