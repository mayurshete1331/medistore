package com.medi.app.service;

import com.medi.app.entity.StoreHistoryLog;
import com.medi.app.repository.StoreHistoryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StoreHistoryService {

    private final StoreHistoryLogRepository storeHistoryLogRepository;

    @Transactional
    public StoreHistoryLog recordLog(Long storeId, String eventType, String title, String description,
                                     String performedBy, String referenceId, Double amount) {
        if (storeId == null) {
            storeId = 1L; // Fallback to main store
        }

        StoreHistoryLog historyLog = StoreHistoryLog.builder()
                .storeId(storeId)
                .timestamp(LocalDateTime.now())
                .eventType(eventType)
                .title(title)
                .description(description)
                .performedBy(performedBy != null && !performedBy.trim().isEmpty() ? performedBy : "Store Staff")
                .referenceId(referenceId)
                .amount(amount)
                .build();

        log.info("Recorded Store History [Store {}]: {} - {}", storeId, eventType, title);
        return storeHistoryLogRepository.save(historyLog);
    }

    public List<StoreHistoryLog> getStoreHistory(Long storeId) {
        return storeHistoryLogRepository.findByStoreIdOrderByTimestampDesc(storeId);
    }

    public List<StoreHistoryLog> getStoreHistoryByEvent(Long storeId, String eventType) {
        return storeHistoryLogRepository.findByStoreIdAndEventTypeOrderByTimestampDesc(storeId, eventType);
    }
}
