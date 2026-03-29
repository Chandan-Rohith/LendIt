package com.lendit.lendit_backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.lendit.lendit_backend.entity.Booking;
import com.lendit.lendit_backend.entity.Booking.BookingStatus;

import jakarta.persistence.LockModeType;

public interface BookingRepository extends JpaRepository<Booking, Long> 
{

    // Get bookings made by a borrower (My Orders)
    List<Booking> findByBorrowerIdOrderByCreatedAtDescIdDesc(Long borrowerId);


    // Get all bookings for tools owned by a user
    @Query("SELECT b FROM Booking b WHERE b.tool.owner.id = :ownerId ORDER BY b.createdAt DESC, b.id DESC")
    List<Booking> findByToolOwnerId(@Param("ownerId") Long ownerId);


    // Get bookings for a specific tool
    List<Booking> findByToolId(Long toolId);


    // Check overlapping approved bookings for a tool
    @Query("SELECT b FROM Booking b WHERE b.tool.id = :toolId AND b.status = :status " +
           "AND (b.startDate <= :endDate AND b.endDate >= :startDate)")
    List<Booking> findOverlappingBookings(
            @Param("toolId") Long toolId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") BookingStatus status
    );


    // Scheduler: mark expired approved bookings as completed
    @Modifying
    @Transactional
    @Query("UPDATE Booking b SET b.status = com.lendit.lendit_backend.entity.Booking.BookingStatus.COMPLETED " +
           "WHERE b.status = com.lendit.lendit_backend.entity.Booking.BookingStatus.APPROVED " +
           "AND b.endDate < :today")
    int markApprovedBookingsCompletedBefore(@Param("today") LocalDate today);


    // Lock bookings for a tool to prevent race condition during booking creation
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.tool.id = :toolId")
    List<Booking> lockBookingsForTool(@Param("toolId") Long toolId);

}