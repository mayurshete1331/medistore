package com.medi.app.repository;

import com.medi.app.entity.StoreHistoryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreHistoryLogRepository extends JpaRepository<StoreHistoryLog, Long> {

    List<StoreHistoryLog> findByStoreIdOrderByTimestampDesc(Long storeId);

    List<StoreHistoryLog> findByStoreIdAndEventTypeOrderByTimestampDesc(Long storeId, String eventType);
}
