package com.medi.app.repository;

import com.medi.app.entity.PartnerStore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartnerStoreRepository extends JpaRepository<PartnerStore, Long> {
    List<PartnerStore> findByIsOpenTrue();
}
