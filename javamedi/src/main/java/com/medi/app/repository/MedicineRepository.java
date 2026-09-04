package com.medi.app.repository;

import com.medi.app.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    @Query("SELECT m FROM Medicine m WHERE " +
           "LOWER(m.brandName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.genericName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.manufacturer) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.rackLocation) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Medicine> searchMedicines(@Param("query") String query);

    List<Medicine> findByCategory(String category);

    @Query("SELECT m FROM Medicine m JOIN m.batches b " +
           "GROUP BY m " +
           "HAVING SUM(b.stockPacks) <= m.reorderLevel")
    List<Medicine> findLowStockMedicines();
}
