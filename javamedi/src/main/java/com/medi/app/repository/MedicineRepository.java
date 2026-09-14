package com.medi.app.repository;

import com.medi.app.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

       // Store-Scoped Queries
       List<Medicine> findByStoreId(Long storeId);

       @Query("SELECT m FROM Medicine m WHERE m.storeId = :storeId AND (" +
                     "LOWER(m.brandName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(m.genericName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(m.manufacturer) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(m.barcode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(m.rackLocation) LIKE LOWER(CONCAT('%', :query, '%')))")
       List<Medicine> searchMedicinesByStore(@Param("storeId") Long storeId, @Param("query") String query);

       List<Medicine> findByStoreIdAndCategory(Long storeId, String category);

       @Query("SELECT m FROM Medicine m JOIN m.batches b " +
                     "WHERE m.storeId = :storeId " +
                     "GROUP BY m " +
                     "HAVING SUM(b.stockPacks) <= m.reorderLevel")
       List<Medicine> findLowStockMedicinesByStore(@Param("storeId") Long storeId);

       Optional<Medicine> findByStoreIdAndBrandName(Long storeId, String brandName);

       Optional<Medicine> findByStoreIdAndBarcode(Long storeId, String barcode);

       // Legacy / Global Queries
       @Query("SELECT m FROM Medicine m WHERE " +
                     "LOWER(m.brandName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(m.genericName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(m.manufacturer) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(m.barcode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(m.rackLocation) LIKE LOWER(CONCAT('%', :query, '%'))")
       List<Medicine> searchMedicines(@Param("query") String query);

       Optional<Medicine> findByBarcode(String barcode);

       Optional<Medicine> findByBrandName(String brandName);

       List<Medicine> findByCategory(String category);

       @Query("SELECT m FROM Medicine m JOIN m.batches b " +
                     "GROUP BY m " +
                     "HAVING SUM(b.stockPacks) <= m.reorderLevel")
       List<Medicine> findLowStockMedicines();
}
