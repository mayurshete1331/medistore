package com.medi.app.repository;

import com.medi.app.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findAllByOrderByTimestampDesc();

    List<Invoice> findByCustomerPhoneContainingOrderByTimestampDesc(String customerPhone);

    List<Invoice> findByCustomerNameContainingIgnoreCaseOrderByTimestampDesc(String customerName);

    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i")
    Double getTotalRevenue();

    @Query("SELECT COALESCE(SUM(i.totalCostPrice), 0) FROM Invoice i")
    Double getTotalCostOfGoods();

    @Query("SELECT COALESCE(SUM(i.grossProfit), 0) FROM Invoice i")
    Double getTotalGrossProfit();

    @Query("SELECT ii.medicineId, ii.medicineName, ii.genericName, " +
           "SUM(ii.quantity) as totalQty, SUM(ii.total) as totalRev, " +
           "SUM(ii.total - (ii.costPrice * ii.quantity)) as totalProfit " +
           "FROM InvoiceItem ii " +
           "GROUP BY ii.medicineId, ii.medicineName, ii.genericName " +
           "ORDER BY totalRev DESC")
    List<Object[]> findTopSellingMedicinesData();
}
