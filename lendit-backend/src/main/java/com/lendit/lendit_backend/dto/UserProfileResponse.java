package com.lendit.lendit_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse 
{
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String city;
    private String address;
    private Double latitude;
    private Double longitude;
    private Double averageRating;
    private String riskClassification;
    private Double riskScore;
}
