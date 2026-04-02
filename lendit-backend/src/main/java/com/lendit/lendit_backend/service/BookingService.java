package com.lendit.lendit_backend.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lendit.lendit_backend.dto.BookingRequest;
import com.lendit.lendit_backend.dto.BookingResponse;
import com.lendit.lendit_backend.entity.Booking;
import com.lendit.lendit_backend.entity.Booking.BookingStatus;
import com.lendit.lendit_backend.entity.Tool;
import com.lendit.lendit_backend.entity.User;
import com.lendit.lendit_backend.repository.BlockedDateRepository;
import com.lendit.lendit_backend.repository.BookingRepository;
import com.lendit.lendit_backend.repository.ReviewRepository;
import com.lendit.lendit_backend.repository.ToolRepository;
import com.lendit.lendit_backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService 
{

    private final BookingRepository bookingRepository;
    private final ToolRepository toolRepository;
    private final UserRepository userRepository;
    private final BlockedDateRepository blockedDateRepository;
    private final ReviewRepository reviewRepository;

    @Transactional
    public BookingResponse createBooking(BookingRequest request, Long borrowerId) 
    {
        Tool tool = toolRepository.findById(request.getToolId())
                .orElseThrow(() -> new RuntimeException("Tool not found"));

        if (tool.getOwner().getId().equals(borrowerId)) 
        {
            throw new RuntimeException("You cannot book your own tool");
        }

        User borrower = userRepository.findById(borrowerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check for blocked dates
        LocalDate current = request.getStartDate();
        while (!current.isAfter(request.getEndDate())) 
        {
            if (blockedDateRepository.existsByToolIdAndBlockedDate(request.getToolId(), current)) 
            {
                throw new RuntimeException("Some selected dates are blocked by the owner");
            }
            current = current.plusDays(1);
        }
        // Lock bookings for this tool to prevent race conditions
        bookingRepository.lockBookingsForTool(request.getToolId());

        // Check for overlapping accepted bookings
        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
            request.getToolId(), request.getStartDate(), request.getEndDate(), BookingStatus.APPROVED);

        if (!overlapping.isEmpty()) 
        {
            throw new RuntimeException("Tool is already booked for some of the selected dates");
        }

        Booking booking = Booking.builder()
                .tool(tool)
                .borrower(borrower)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(BookingStatus.PENDING)
                .build();

        booking = bookingRepository.save(booking);
        return mapToResponse(booking, borrowerId);
    }

    public List<BookingResponse> getMyOrders(Long borrowerId) 
    {
        autoCompleteExpiredApprovedBookings();
        List<Booking> bookings = bookingRepository.findByBorrowerIdOrderByCreatedAtDescIdDesc(borrowerId);
        return bookings.stream()
                .map(b -> mapToResponse(b, borrowerId))
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getBookingsForMyTools(Long ownerId) 
    {
        autoCompleteExpiredApprovedBookings();
        List<Booking> bookings = bookingRepository.findByToolOwnerId(ownerId);
        return bookings.stream()
                .map(b -> mapToResponse(b, ownerId))
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getBookingsForTool(Long toolId, Long userId) 
    {
        autoCompleteExpiredApprovedBookings();
        List<Booking> bookings = bookingRepository.findByToolId(toolId);
        return bookings.stream()
                .map(b -> mapToResponse(b, userId))
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse updateBookingStatus(Long bookingId, String status, Long userId) 
    {
        autoCompleteExpiredApprovedBookings();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        BookingStatus newStatus;
        try 
        {
            newStatus = BookingStatus.valueOf(status.toUpperCase());
        } 
        catch (IllegalArgumentException ex) 
        {
            throw new RuntimeException("Invalid booking status");
        }

        if (newStatus == BookingStatus.APPROVED || newStatus == BookingStatus.REJECTED) 
        {
            if (booking.getStatus() != BookingStatus.PENDING) 
            {
                throw new RuntimeException("Only pending bookings can be approved or rejected");
            }
            if (!booking.getTool().getOwner().getId().equals(userId)) 
            {
                throw new RuntimeException("Only the tool owner can accept/reject bookings");
            }
        } 
        else if (newStatus == BookingStatus.COMPLETED) 
        {
            if (booking.getStatus() != BookingStatus.APPROVED) 
            {
                throw new RuntimeException("Only approved bookings can be marked as completed");
            }
            if (!booking.getBorrower().getId().equals(userId)) 
            {
                throw new RuntimeException("Only the borrower can mark booking as completed");
            }
            LocalDate today = LocalDate.now(ZoneId.systemDefault());
            if (today.isBefore(booking.getStartDate()))
            {
                throw new RuntimeException("Booking has not started yet. You can mark it completed during booked dates");
            }
            if (today.isAfter(booking.getEndDate()))
            {
                throw new RuntimeException("Booking end date has passed. It will be auto-completed by the scheduler");
            }
        } 
        else 
        {
            throw new RuntimeException("Unsupported status transition");
        }

        booking.setStatus(newStatus);
        booking = bookingRepository.save(booking);

        return mapToResponse(booking, userId);
    }

    private BookingResponse mapToResponse(Booking booking, Long currentUserId) 
    {
        boolean canReview = false;

        if (booking.getStatus() == BookingStatus.COMPLETED  && LocalDate.now().isAfter(booking.getEndDate())) 
        {
            // Check if current user already reviewed this booking
            canReview = reviewRepository.findByBookingIdAndReviewerId(booking.getId(), currentUserId).isEmpty();
        }

        return BookingResponse.builder()
                .id(booking.getId())
                .toolId(booking.getTool().getId())
                .toolName(booking.getTool().getName())
            .toolPhotoUrl(booking.getTool().getImage() != null
                ? "/api/tools/" + booking.getTool().getId() + "/image"
                : null)
                .ownerName(booking.getTool().getOwner().getFullName())
                .ownerId(booking.getTool().getOwner().getId())
                .borrowerName(booking.getBorrower().getFullName())
                .borrowerId(booking.getBorrower().getId())
                .startDate(booking.getStartDate())
                .endDate(booking.getEndDate())
                .status(booking.getStatus().name())
                .canReview(canReview)
                .build();
    }

    @Transactional
    public int autoCompleteExpiredApprovedBookings()
    {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        return bookingRepository.markApprovedBookingsCompletedBefore(today);
    }
}
