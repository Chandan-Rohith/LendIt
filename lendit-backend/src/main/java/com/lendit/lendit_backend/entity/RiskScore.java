package com.lendit.lendit_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskScore 
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private Double score = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskClassification classification = RiskClassification.LOW;

    private LocalDateTime lastCalculated;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastCalculated = LocalDateTime.now();
    }

    public enum RiskClassification 
    {
        LOW, MEDIUM, HIGH
    }
}
