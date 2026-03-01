package com.lendit.lendit_backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lendit.lendit_backend.entity.Booking;
import com.lendit.lendit_backend.entity.Booking.BookingStatus;

public interface BookingRepository extends JpaRepository<Booking, Long> 
{

    List<Booking> findByBorrowerId(Long borrowerId);

    @Query("SELECT b FROM Booking b WHERE b.tool.owner.id = :ownerId")
    List<Booking> findByToolOwnerId(@Param("ownerId") Long ownerId);

    List<Booking> findByToolId(Long toolId);

    @Query("SELECT b FROM Booking b WHERE b.tool.id = :toolId AND b.status = :status " +
            "AND ((b.startDate <= :endDate AND b.endDate >= :startDate))")
    List<Booking> findOverlappingBookings(@Param("toolId") Long toolId,
                                           @Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate,
                                           @Param("status") BookingStatus status);
}
