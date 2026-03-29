package com.lendit.lendit_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequest 
{

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    // private Boolean damageReport = false;

    private String remarks;

    // New fields from frontend
    private Integer toolCondition;
    private Integer experience;
    
    // Accept snake_case payload keys used by frontend
    @Min(0)
    @Max(3)
    @JsonProperty("damage_score")
    private Integer damageScore;

    @Min(0)
    @Max(3)
    @JsonProperty("experience_score")
    private Integer experienceScore;
}
