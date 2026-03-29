package com.lendit.lendit_backend.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse 
{
    private Long id;
    private Long toolId;
    private String toolName;
    private String toolPhotoUrl;
    private String ownerName;
    private Long ownerId;
    private String borrowerName;
    private Long borrowerId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Boolean canReview;
}
