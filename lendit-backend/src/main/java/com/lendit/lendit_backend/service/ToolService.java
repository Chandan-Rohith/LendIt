package com.lendit.lendit_backend.service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.lendit.lendit_backend.dto.ToolRequest;
import com.lendit.lendit_backend.dto.ToolResponse;
import com.lendit.lendit_backend.entity.BlockedDate;
import com.lendit.lendit_backend.entity.Category;
import com.lendit.lendit_backend.entity.Tool;
import com.lendit.lendit_backend.entity.User;
import com.lendit.lendit_backend.repository.BlockedDateRepository;
import com.lendit.lendit_backend.repository.CategoryRepository;
import com.lendit.lendit_backend.repository.ReviewRepository;
import com.lendit.lendit_backend.repository.ToolRepository;
import com.lendit.lendit_backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ToolService {

    private final ToolRepository toolRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final BlockedDateRepository blockedDateRepository;
    private final ReviewRepository reviewRepository;

    @Transactional
    public ToolResponse addTool(ToolRequest request, MultipartFile image, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        byte[] imageBytes = null;
        String imageType = null;
        if (image != null && !image.isEmpty()) {
            imageType = image.getContentType();
            if (imageType != null && !imageType.startsWith("image/")) {
                throw new RuntimeException("Only image files are allowed");
            }

            try {
                imageBytes = image.getBytes();
            } catch (IOException e) {
                throw new RuntimeException("Failed to read image", e);
            }
        }

        Tool tool = Tool.builder()
                .name(request.getName())
                .description(request.getDescription())
                .image(imageBytes)
                .imageType(imageType)
                .category(category)
                .owner(owner)
                .available(true)
                .build();

        tool = toolRepository.save(tool);

        // Save blocked dates
        if (request.getBlockedDates() != null) 
        {
            for (LocalDate date : request.getBlockedDates()) 
            {
                BlockedDate blockedDate = BlockedDate.builder()
                        .tool(tool)
                        .blockedDate(date)
                        .build();
                blockedDateRepository.save(blockedDate);
            }
        }

        return mapToResponse(tool, null);
    }

    public Tool getToolEntity(Long toolId) {
        return toolRepository.findById(toolId)
                .orElseThrow(() -> new RuntimeException("Tool not found"));
    }

        public List<ToolResponse> getToolsNearUser(Long userId, Double lat, Double lng) 
    {
            if (lat == null || lng == null) {
                throw new RuntimeException("Location required to fetch nearby tools");
            }
            double sourceLat = lat;
            double sourceLng = lng;

            Long repoUserId = userId != null ? userId : -1L;
            if (userId != null) {
                userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            }

            List<Tool> tools = toolRepository.findToolsWithinRadius(
                sourceLat, sourceLng, repoUserId);

            return tools.stream()
                .map(tool -> {
                    double distance = calculateDistance(
                        sourceLat, sourceLng,
                        tool.getOwner().getLatitude(), tool.getOwner().getLongitude());
                    return mapToResponse(tool, distance);
                })
                .collect(Collectors.toList());
    }

    public List<ToolResponse> getToolsByCategory(Long categoryId, Long userId, Double lat, Double lng) 
    {
        if (lat == null || lng == null) {
            throw new RuntimeException("Location required to fetch nearby tools");
        }
        double sourceLat = lat;
        double sourceLng = lng;

        Long repoUserId = userId != null ? userId : -1L;
        if (userId != null) {
            userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        }

        List<Tool> tools = toolRepository.findByCategoryIdExcludingOwner(categoryId, repoUserId);

        return tools.stream()
                .map(tool -> {
                    double distance = calculateDistance(
                            sourceLat, sourceLng,
                            tool.getOwner().getLatitude(), tool.getOwner().getLongitude());
                    if (distance <= 10) {
                        return mapToResponse(tool, distance);
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingDouble(ToolResponse::getDistance))
                .collect(Collectors.toList());
    }

    public List<ToolResponse> searchTools(String keyword, Long userId, Double lat, Double lng) {
        if (lat == null || lng == null) {
            throw new RuntimeException("Location required to fetch nearby tools");
        }
        double sourceLat = lat;
        double sourceLng = lng;

        Long repoUserId = userId != null ? userId : -1L;
        if (userId != null) {
            userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        }

        List<Tool> tools = toolRepository.searchByKeyword(keyword, repoUserId);

        return tools.stream()
                .map(tool -> {
                    double distance = calculateDistance(
                            sourceLat, sourceLng,
                            tool.getOwner().getLatitude(), tool.getOwner().getLongitude());
                    if (distance <= 10) {
                        return mapToResponse(tool, distance);
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingDouble(ToolResponse::getDistance))
                .collect(Collectors.toList());
    }

        public ToolResponse getToolById(Long toolId, Long userId, Double lat, Double lng) {
        Tool tool = toolRepository.findById(toolId)
            .orElseThrow(() -> new RuntimeException("Tool not found"));
            if (userId != null) {
                userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            }

            if (lat == null || lng == null) {
                throw new RuntimeException("Location required to fetch tool details");
            }
        double sourceLat = lat;
        double sourceLng = lng;

        double distance = calculateDistance(
            sourceLat, sourceLng,
            tool.getOwner().getLatitude(), tool.getOwner().getLongitude());

        return mapToResponse(tool, distance);
        }

    public List<ToolResponse> getMyTools(Long ownerId) {
        List<Tool> tools = toolRepository.findByOwnerIdOrderByCreatedAtDescIdDesc(ownerId);
        return tools.stream()
                .map(tool -> mapToResponse(tool, 0.0))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteTool(Long toolId, Long ownerId) {
        Tool tool = toolRepository.findById(toolId)
                .orElseThrow(() -> new RuntimeException("Tool not found"));

        if (!tool.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("You can only delete your own tools");
        }

        toolRepository.delete(tool);
    }

    public List<LocalDate> getBlockedDates(Long toolId) {
        return blockedDateRepository.findByToolId(toolId).stream()
                .map(BlockedDate::getBlockedDate)
                .collect(Collectors.toList());
    }

    // Haversine formula
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private ToolResponse mapToResponse(Tool tool, Double distance) {
        Double ownerRating = reviewRepository.findAverageRatingByRevieweeId(tool.getOwner().getId());

        return ToolResponse.builder()
                .id(tool.getId())
                .name(tool.getName())
                .description(tool.getDescription())
                .photoUrl(tool.getImage() != null ? buildImageUrl(tool.getId()) : null)
                .categoryName(tool.getCategory().getName())
                .categoryId(tool.getCategory().getId())
                .ownerName(tool.getOwner().getFullName())
                .ownerId(tool.getOwner().getId())
                .ownerRating(ownerRating != null ? ownerRating : 0.0)
                .distance(distance)
                .available(tool.getAvailable())
                .build();
    }

    private String buildImageUrl(Long toolId) {
        return "/api/tools/" + toolId + "/image";
    }
}
