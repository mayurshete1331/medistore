package com.medi.app.service;

import com.medi.app.repository.InvoiceRepository;
import com.medi.app.repository.StoreOrderRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class SequenceGeneratorService {

    private final InvoiceRepository invoiceRepository;
    private final StoreOrderRepository storeOrderRepository;

    private final AtomicLong invoiceCounter = new AtomicLong(1000);
    private final AtomicLong orderCounter = new AtomicLong(1000);

    private static final DateTimeFormatter YEAR_MONTH_FMT = DateTimeFormatter.ofPattern("yyyyMM");

    @PostConstruct
    public void init() {
        try {
            Long maxInvId = invoiceRepository.getMaxInvoiceId();
            if (maxInvId != null && maxInvId > 0) {
                invoiceCounter.set(maxInvId + 1000);
            }
            Long maxOrdId = storeOrderRepository.getMaxOrderId();
            if (maxOrdId != null && maxOrdId > 0) {
                orderCounter.set(maxOrdId + 1000);
            }
            log.info("Initialized sequence counters - Invoice: {}, Order: {}", invoiceCounter.get(), orderCounter.get());
        } catch (Exception e) {
            log.warn("Could not pre-seed sequence counters from database, starting defaults: {}", e.getMessage());
        }
    }

    public synchronized String nextInvoiceNumber() {
        String period = LocalDateTime.now().format(YEAR_MONTH_FMT);
        long seq = invoiceCounter.incrementAndGet();
        return String.format("INV-%s-%05d", period, seq);
    }

    public synchronized String nextDoctorOrderNumber() {
        String period = LocalDateTime.now().format(YEAR_MONTH_FMT);
        long seq = orderCounter.incrementAndGet();
        return String.format("ORD-DOC-%s-%05d", period, seq);
    }

    public synchronized String nextCustomerOrderNumber() {
        String period = LocalDateTime.now().format(YEAR_MONTH_FMT);
        long seq = orderCounter.incrementAndGet();
        return String.format("ORD-CUST-%s-%05d", period, seq);
    }
}
