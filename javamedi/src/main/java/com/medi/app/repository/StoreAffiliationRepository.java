package com.medi.app.repository;

import com.medi.app.entity.StoreAffiliation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreAffiliationRepository extends JpaRepository<StoreAffiliation, Long> {

    List<StoreAffiliation> findByUserId(Long userId);

    List<StoreAffiliation> findByStoreId(Long storeId);

    List<StoreAffiliation> findByStoreIdAndRole(Long storeId, String role);

    Optional<StoreAffiliation> findByStoreIdAndUserId(Long storeId, Long userId);

    boolean existsByStoreIdAndUserId(Long storeId, Long userId);
}
