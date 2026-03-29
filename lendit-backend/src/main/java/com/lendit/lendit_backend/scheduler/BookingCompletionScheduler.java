package com.lendit.lendit_backend.scheduler;

import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.lendit.lendit_backend.service.BookingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingCompletionScheduler 
{

    private final BookingService bookingService;

    // Run daily at 00:05 server time
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void completePastApprovedBookings() 
    {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        int updated = bookingService.autoCompleteExpiredApprovedBookings();
        log.info("BookingCompletionScheduler: marked {} bookings as COMPLETED before {}", updated, today);
    }
}
