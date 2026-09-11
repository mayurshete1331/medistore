package com.medi.app.service;

import com.medi.app.dto.BillingDtos;
import com.medi.app.entity.Batch;
import com.medi.app.entity.Invoice;
import com.medi.app.entity.InvoiceItem;
import com.medi.app.entity.Medicine;
import com.medi.app.entity.User;
import com.medi.app.exception.PharmaComplianceException;
import com.medi.app.exception.ResourceNotFoundException;
import com.medi.app.repository.BatchRepository;
import com.medi.app.repository.InvoiceRepository;
import com.medi.app.repository.MedicineRepository;
import com.medi.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final MedicineRepository medicineRepository;
    private final BatchRepository batchRepository;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final InventoryService inventoryService;
    private final StoreHistoryService storeHistoryService;
    private final UserRepository userRepository;

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAllByOrderByTimestampDesc();
    }

    public Invoice getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceNumber));
    }

    @Transactional
    public Invoice checkout(BillingDtos.CheckoutRequest req) {
        LocalDateTime now = LocalDateTime.now();
        String invoiceNumber = sequenceGeneratorService.nextInvoiceNumber();

        double subtotal = 0.0;
        double totalDiscount = 0.0;
        double totalTax = 0.0;
        double totalCostPrice = 0.0;
        boolean hasScheduleH = false;

        String custName = req.getResolvedCustomerName();
        String custPhone = req.getResolvedCustomerPhone();
        String docName = req.getResolvedDoctorName();
        String docReg = req.getResolvedDoctorRegNo();

        List<InvoiceItem> invoiceItems = new ArrayList<>();

        if (req.getItems() != null) {
            for (BillingDtos.CartItemDto itemDto : req.getItems()) {
                Medicine med = null;
                if (itemDto.getMedicineId() != null) {
                    med = medicineRepository.findById(itemDto.getMedicineId()).orElse(null);
                }
                if (med == null && itemDto.getMedicineName() != null && !itemDto.getMedicineName().trim().isEmpty()) {
                    med = medicineRepository.findByBrandName(itemDto.getMedicineName().trim()).orElse(null);
                }

                // Compliance Check for Schedule H / H1 / Narcotic drugs
                if (med != null && (Boolean.TRUE.equals(med.getIsScheduleH()) || Boolean.TRUE.equals(med.getIsScheduleH1()) || Boolean.TRUE.equals(med.getIsNarcotic()))) {
                    hasScheduleH = true;
                    if (docName.isEmpty() || docReg.isEmpty()) {
                        throw new PharmaComplianceException("Prescription compliance violation: Medicine '" + med.getBrandName() + 
                                "' is classified under Schedule H/H1/Narcotic regulations. Prescribing Doctor's Name and MCI Registration Number are mandatory under the Drugs & Cosmetics Act.");
                    }
                }

                // Batch lookup fallback
                Batch batch = null;
                if (itemDto.getBatchId() != null) {
                    batch = batchRepository.findById(itemDto.getBatchId()).orElse(null);
                }
                if (batch == null && med != null) {
                    List<Batch> medBatches = batchRepository.findByMedicineId(med.getId());
                    if (!medBatches.isEmpty()) {
                        batch = medBatches.get(0);
                    }
                }

                // Defensive calculation parameters
                int qty = itemDto.getQuantity() != null && itemDto.getQuantity() > 0 ? itemDto.getQuantity() : 1;
                double unitPrice = itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : (batch != null && batch.getSalePrice() != null ? batch.getSalePrice() : 0.0);
                double mrp = itemDto.getMrp() != null ? itemDto.getMrp() : (batch != null && batch.getMrp() != null ? batch.getMrp() : unitPrice);
                double costPrice = itemDto.getCostPrice() != null ? itemDto.getCostPrice() : (batch != null && batch.getPurchasePrice() != null ? batch.getPurchasePrice() : 0.0);
                double discPct = itemDto.getDiscountPercent() != null ? itemDto.getDiscountPercent() : 0.0;
                int gst = itemDto.getGstRate() != null ? itemDto.getGstRate() : (med != null && med.getGstRate() != null ? med.getGstRate() : 0);

                double gross = qty * unitPrice;
                double discountAmt = (gross * discPct) / 100.0;
                double lineSubtotal = gross - discountAmt;
                double lineTax = (lineSubtotal * gst) / 100.0;
                double lineTotal = lineSubtotal + lineTax;

                subtotal += lineSubtotal;
                totalDiscount += discountAmt;
                totalTax += lineTax;
                totalCostPrice += costPrice * qty;

                String medName = itemDto.getMedicineName() != null && !itemDto.getMedicineName().trim().isEmpty()
                        ? itemDto.getMedicineName().trim()
                        : (med != null ? med.getBrandName() : "Item");
                String genName = itemDto.getGenericName() != null ? itemDto.getGenericName().trim() : (med != null ? med.getGenericName() : "");
                String bNum = itemDto.getBatchNumber() != null && !itemDto.getBatchNumber().trim().isEmpty()
                        ? itemDto.getBatchNumber().trim()
                        : (batch != null ? batch.getBatchNumber() : "DEFAULT");
                String expDate = itemDto.getExpiryDate() != null && !itemDto.getExpiryDate().trim().isEmpty()
                        ? itemDto.getExpiryDate().trim()
                        : (batch != null ? batch.getExpiryDate() : "2026-12");
                String hsn = itemDto.getHsnCode() != null && !itemDto.getHsnCode().trim().isEmpty()
                        ? itemDto.getHsnCode().trim()
                        : (med != null ? med.getHsnCode() : "3004");
                String sType = itemDto.getSaleType() != null ? itemDto.getSaleType() : "FULL_PACK";

                InvoiceItem invoiceItem = InvoiceItem.builder()
                        .medicineId(med != null ? med.getId() : itemDto.getMedicineId())
                        .medicineName(medName)
                        .genericName(genName)
                        .batchNumber(bNum)
                        .expiryDate(expDate)
                        .hsnCode(hsn)
                        .saleType(sType)
                        .quantity(qty)
                        .unitPrice(Math.round(unitPrice * 100.0) / 100.0)
                        .mrp(Math.round(mrp * 100.0) / 100.0)
                        .costPrice(Math.round(costPrice * 100.0) / 100.0)
                        .discountPercent(discPct)
                        .gstRate(gst)
                        .taxAmount(Math.round(lineTax * 100.0) / 100.0)
                        .subtotal(Math.round(lineSubtotal * 100.0) / 100.0)
                        .total(Math.round(lineTotal * 100.0) / 100.0)
                        .build();

                invoiceItems.add(invoiceItem);

                // Deduct stock safely
                Long targetBatchId = batch != null ? batch.getId() : itemDto.getBatchId();
                if (targetBatchId != null) {
                    try {
                        int packsDeduct = "FULL_PACK".equalsIgnoreCase(sType) ? qty : 1;
                        inventoryService.deductStock(targetBatchId, packsDeduct);
                    } catch (Exception ex) {
                        log.warn("Batch stock deduction skipped for batch {}: {}", targetBatchId, ex.getMessage());
                    }
                }
            }
        }

        double cgst = Math.round((totalTax / 2.0) * 100.0) / 100.0;
        double sgst = Math.round((totalTax / 2.0) * 100.0) / 100.0;
        double rawGrandTotal = subtotal + totalTax;
        double roundedGrandTotal = Math.round(rawGrandTotal);
        double roundOff = Math.round((roundedGrandTotal - rawGrandTotal) * 100.0) / 100.0;
        double grossProfit = Math.round((subtotal - totalCostPrice) * 100.0) / 100.0;

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .timestamp(now)
                .customerName(custName)
                .customerPhone(custPhone)
                .doctorName(docName)
                .doctorRegNo(docReg)
                .subtotal(Math.round(subtotal * 100.0) / 100.0)
                .totalDiscount(Math.round(totalDiscount * 100.0) / 100.0)
                .cgst(cgst)
                .sgst(sgst)
                .totalTax(Math.round(totalTax * 100.0) / 100.0)
                .roundOff(roundOff)
                .grandTotal(roundedGrandTotal)
                .totalCostPrice(Math.round(totalCostPrice * 100.0) / 100.0)
                .grossProfit(grossProfit)
                .paymentMode(req.getPaymentMode() != null ? req.getPaymentMode() : "CASH")
                .paymentStatus("KHATA".equalsIgnoreCase(req.getPaymentMode()) ? "CREDIT_KHATA" : "PAID")
                .hasScheduleH(hasScheduleH)
                .dispensedBy(req.getDispensedBy() != null ? req.getDispensedBy() : "Counter 1")
                .items(invoiceItems)
                .build();

        for (InvoiceItem item : invoiceItems) {
            item.setInvoice(invoice);
        }
        invoice.setItems(invoiceItems);
        Invoice saved = invoiceRepository.save(invoice);

        // Record in Store History
        try {
            int itemCount = saved.getItems() != null ? saved.getItems().size() : invoiceItems.size();
            storeHistoryService.recordLog(
                    1L,
                    "SALE_BILLING",
                    "Counter POS Bill: " + saved.getInvoiceNumber(),
                    "Invoice " + saved.getInvoiceNumber() + " billed for ₹" + saved.getGrandTotal() + " (" + itemCount + " items, " + saved.getPaymentMode() + ") to " + saved.getCustomerName() + ".",
                    saved.getDispensedBy(),
                    saved.getInvoiceNumber(),
                    saved.getGrandTotal()
            );
        } catch (Exception ex) {
            log.warn("Could not record store history log for {}: {}", saved.getInvoiceNumber(), ex.getMessage());
        }

        return saved;
    }

    public List<Map<String, Object>> lookupCustomers(String query) {
        String cleanQuery = query != null ? query.trim() : "";
        String cleanDigits = cleanQuery.replaceAll("\\D", "");

        // Search requires at least 2 characters or at least 3 digits
        if (cleanDigits.length() < 3 && cleanQuery.length() < 2) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> results = new ArrayList<>();
        Set<String> seenPhones = new HashSet<>();
        Set<Long> seenUserIds = new HashSet<>();

        // 1. Search registered Users with role CUSTOMER (name/email/phone substring)
        List<User> matchedUsers = userRepository.searchCustomers(cleanQuery, cleanDigits);
        for (User u : matchedUsers) {
            seenUserIds.add(u.getId());
            String p = u.getPhone() != null ? u.getPhone().replaceAll("\\D", "") : "";
            if (!p.isEmpty() && seenPhones.contains(p)) continue;
            if (!p.isEmpty()) seenPhones.add(p);

            List<Invoice> pastInvs = !p.isEmpty() && p.length() >= 3
                    ? invoiceRepository.findExactCustomerInvoices("", p)
                    : invoiceRepository.findExactCustomerInvoices(u.getName(), "");

            Map<String, Object> map = new HashMap<>();
            map.put("id", String.valueOf(u.getId()));
            map.put("name", u.getName());
            map.put("phone", u.getPhone());
            map.put("email", u.getEmail());
            map.put("address", u.getCustomerAddress());
            map.put("isRegistered", true);
            map.put("pastBillsCount", pastInvs.size());
            results.add(map);
        }

        // 2. Search past invoices for customers who might not have an explicit user account yet
        List<Invoice> invoiceMatches = invoiceRepository.findExactCustomerInvoices(cleanQuery, cleanDigits);
        for (Invoice inv : invoiceMatches) {
            String p = inv.getCustomerPhone() != null ? inv.getCustomerPhone().replaceAll("\\D", "") : "";
            if (inv.getCustomerName() != null && "walk-in customer".equalsIgnoreCase(inv.getCustomerName().trim()) && p.isEmpty()) {
                continue;
            }
            if (!p.isEmpty() && seenPhones.contains(p)) {
                continue;
            }
            if (!p.isEmpty()) seenPhones.add(p);

            List<Invoice> pastInvs = !p.isEmpty() && p.length() >= 3
                    ? invoiceRepository.findExactCustomerInvoices("", p)
                    : invoiceRepository.findExactCustomerInvoices(inv.getCustomerName(), "");

            Map<String, Object> map = new HashMap<>();
            map.put("name", inv.getCustomerName());
            map.put("phone", inv.getCustomerPhone());
            map.put("doctorName", inv.getDoctorName());
            map.put("doctorRegNo", inv.getDoctorRegNo());
            map.put("isRegistered", false);
            map.put("pastBillsCount", pastInvs.size());
            results.add(map);
        }

        return results.stream().limit(8).collect(Collectors.toList());
    }

    public List<Invoice> getCustomerInvoices(String phone, String name) {
        String cleanPhone = phone != null ? phone.replaceAll("\\D", "") : "";
        String cleanName = name != null ? name.trim() : "";
        if ((!cleanPhone.isEmpty() && cleanPhone.length() >= 3) || (!cleanName.isEmpty() && !"walk-in customer".equalsIgnoreCase(cleanName))) {
            return invoiceRepository.findExactCustomerInvoices(cleanName, cleanPhone);
        }
        return Collections.emptyList();
    }
}
