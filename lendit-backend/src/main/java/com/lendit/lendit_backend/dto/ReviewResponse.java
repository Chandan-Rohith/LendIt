package com.lendit.lendit_backend.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse 
{
    private Long id;
    private Long bookingId;
    private String reviewerName;
    private Long reviewerId;
    private String revieweeName;
    private Long revieweeId;
    private Integer rating;
    // private Boolean damageReport;
    private Integer toolCondition;
    private Integer experience;
    private String remarks;
    private LocalDateTime createdAt;
}
