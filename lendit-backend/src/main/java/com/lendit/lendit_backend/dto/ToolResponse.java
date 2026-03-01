package com.lendit.lendit_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToolResponse {
    private Long id;
    private String name;
    private String description;
    private String photoUrl;
    private String categoryName;
    private Long categoryId;
    private String ownerName;
    private Long ownerId;
    private Double ownerRating;
    private Double distance;
    private Boolean available;
}
