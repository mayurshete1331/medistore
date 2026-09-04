package com.medi.app.repository;

import com.medi.app.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {

    List<Batch> findByMedicineId(Long medicineId);

    // FEFO (First Expired, First Out) query: returns active non-empty batches ordered by expiry date
    @Query("SELECT b FROM Batch b WHERE b.medicine.id = :medId AND b.stockPacks > 0 " +
           "ORDER BY b.expiryDate ASC")
    List<Batch> findFefoBatchesForMedicine(@Param("medId") Long medicineId);
}
