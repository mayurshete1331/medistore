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
import com.medi.app.repository.StoreAffiliationRepository;
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
    private final StoreAffiliationRepository storeAffiliationRepository;

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
                double lineTotal = gross - discountAmt;
                double lineSubtotal = (gst > 0) ? ((lineTotal * 100.0) / (100.0 + gst)) : lineTotal;
                double lineTax = lineTotal - lineSubtotal;

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

                // Deduct stock safely with loose strip cut-dispensing support
                Long targetBatchId = batch != null ? batch.getId() : itemDto.getBatchId();
                if (targetBatchId != null) {
                    try {
                        int unitsPerPack = (med != null && med.getUnitsPerPack() != null && med.getUnitsPerPack() > 1) 
                                ? med.getUnitsPerPack() : 1;
                        inventoryService.deductStock(targetBatchId, sType, qty, unitsPerPack);
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

        // Update customer Khata balance if billed under credit
        if ("KHATA".equalsIgnoreCase(saved.getPaymentMode())) {
            updateCustomerKhataBalance(saved.getCustomerPhone(), saved.getGrandTotal(), true);
        }

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
            map.put("khataBalance", u.getKhataBalance() != null ? u.getKhataBalance() : 0.0);
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
            map.put("khataBalance", 0.0);
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

    @Transactional
    public void updateCustomerKhataBalance(String phone, double amountDelta, boolean isAddition) {
        if (phone == null || phone.trim().isEmpty() || amountDelta <= 0) return;
        String cleanDigits = phone.replaceAll("\\D", "");
        if (cleanDigits.length() < 3) return;

        List<User> matchedUsers = userRepository.searchCustomers("", cleanDigits);
        for (User u : matchedUsers) {
            double current = u.getKhataBalance() != null ? u.getKhataBalance() : 0.0;
            double updated = isAddition ? (current + amountDelta) : Math.max(0.0, current - amountDelta);
            u.setKhataBalance(Math.round(updated * 100.0) / 100.0);
            userRepository.save(u);

            storeAffiliationRepository.findByStoreIdAndUserId(1L, u.getId()).ifPresent(aff -> {
                aff.setOutstandingKhataBalance(u.getKhataBalance());
                storeAffiliationRepository.save(aff);
            });
        }
    }

    @Transactional
    public Invoice processSalesReturn(BillingDtos.SalesReturnRequest req) {
        Invoice invoice = null;
        if (req.getInvoiceNumber() != null && !req.getInvoiceNumber().trim().isEmpty()) {
            invoice = getInvoiceByNumber(req.getInvoiceNumber().trim());
        } else if (req.getInvoiceId() != null) {
            invoice = invoiceRepository.findById(req.getInvoiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + req.getInvoiceId()));
        } else {
            throw new IllegalArgumentException("Invoice number or ID is required for processing return");
        }

        if (req.getReturnedItems() == null || req.getReturnedItems().isEmpty()) {
            throw new IllegalArgumentException("At least one item must be specified for return");
        }

        double totalRefund = 0.0;
        LocalDateTime now = LocalDateTime.now();

        for (BillingDtos.ReturnItemDto retItem : req.getReturnedItems()) {
            if (retItem.getReturnQuantity() == null || retItem.getReturnQuantity() <= 0) continue;

            InvoiceItem targetItem = null;
            if (retItem.getInvoiceItemId() != null && invoice.getItems() != null) {
                targetItem = invoice.getItems().stream()
                        .filter(it -> it.getId() != null && it.getId().equals(retItem.getInvoiceItemId()))
                        .findFirst().orElse(null);
            }
            if (targetItem == null && retItem.getMedicineId() != null && invoice.getItems() != null) {
                targetItem = invoice.getItems().stream()
                        .filter(it -> it.getMedicineId() != null && it.getMedicineId().equals(retItem.getMedicineId()))
                        .findFirst().orElse(null);
            }
            if (targetItem == null) continue;

            int alreadyReturned = targetItem.getReturnedQuantity() != null ? targetItem.getReturnedQuantity() : 0;
            int maxReturnable = targetItem.getQuantity() - alreadyReturned;
            int actualReturnQty = Math.min(retItem.getReturnQuantity(), maxReturnable);
            if (actualReturnQty <= 0) continue;

            targetItem.setReturnedQuantity(alreadyReturned + actualReturnQty);
            if (targetItem.getReturnedQuantity() >= targetItem.getQuantity()) {
                targetItem.setIsReturned(true);
            }

            double unitPrice = targetItem.getUnitPrice() != null ? targetItem.getUnitPrice() : 0.0;
            double discPct = targetItem.getDiscountPercent() != null ? targetItem.getDiscountPercent() : 0.0;
            double itemRefund = actualReturnQty * unitPrice * (1.0 - (discPct / 100.0));
            totalRefund += itemRefund;

            // Replenish batch stock
            Long medId = targetItem.getMedicineId();
            Medicine med = medId != null ? medicineRepository.findById(medId).orElse(null) : null;
            int unitsPerPack = (med != null && med.getUnitsPerPack() != null && med.getUnitsPerPack() > 1) ? med.getUnitsPerPack() : 1;

            String itemBatchNum = targetItem.getBatchNumber();
            List<Batch> batches = medId != null ? batchRepository.findByMedicineId(medId) : Collections.emptyList();
            Batch targetBatch = batches.stream()
                    .filter(b -> itemBatchNum != null && b.getBatchNumber() != null && b.getBatchNumber().equalsIgnoreCase(itemBatchNum))
                    .findFirst().orElse(!batches.isEmpty() ? batches.get(0) : null);

            if (targetBatch != null) {
                inventoryService.replenishStock(targetBatch.getId(), targetItem.getSaleType(), actualReturnQty, unitsPerPack);
            }
        }

        totalRefund = Math.round(totalRefund * 100.0) / 100.0;
        double currentReturnAmt = invoice.getReturnAmount() != null ? invoice.getReturnAmount() : 0.0;
        invoice.setIsReturned(true);
        invoice.setReturnAmount(Math.round((currentReturnAmt + totalRefund) * 100.0) / 100.0);
        invoice.setReturnReason(req.getReturnReason() != null ? req.getReturnReason() : "Customer Return");
        invoice.setReturnTimestamp(now);
        if (invoice.getCreditNoteNumber() == null || invoice.getCreditNoteNumber().isEmpty()) {
            invoice.setCreditNoteNumber("CN-" + invoice.getInvoiceNumber() + "-" + (System.currentTimeMillis() % 10000));
        }

        if ("KHATA_CREDIT".equalsIgnoreCase(req.getRefundMode()) && invoice.getCustomerPhone() != null) {
            updateCustomerKhataBalance(invoice.getCustomerPhone(), totalRefund, false);
        }

        Invoice saved = invoiceRepository.save(invoice);

        try {
            storeHistoryService.recordLog(
                    1L,
                    "SALES_RETURN",
                    "Sales Return: " + saved.getCreditNoteNumber(),
                    "Returned items for invoice " + saved.getInvoiceNumber() + ". Refunded ₹" + totalRefund + " (" + (req.getRefundMode() != null ? req.getRefundMode() : "CASH") + ") Reason: " + saved.getReturnReason(),
                    req.getProcessedBy() != null ? req.getProcessedBy() : "Store Pharmacist",
                    saved.getCreditNoteNumber(),
                    -totalRefund
            );
        } catch (Exception ex) {
            log.warn("Failed recording sales return history log: {}", ex.getMessage());
        }

        return saved;
    }

    @Transactional
    public Map<String, Object> recordKhataPayment(BillingDtos.KhataPaymentRequest req) {
        double amount = req.getPaymentAmount() != null ? req.getPaymentAmount() : 0.0;
        User customer = null;
        if (req.getCustomerId() != null) {
            customer = userRepository.findById(req.getCustomerId()).orElse(null);
        }
        if (customer == null && req.getCustomerPhone() != null && !req.getCustomerPhone().trim().isEmpty()) {
            String clean = req.getCustomerPhone().replaceAll("\\D", "");
            List<User> list = userRepository.searchCustomers("", clean);
            if (!list.isEmpty()) customer = list.get(0);
        }

        double previousBalance = 0.0;
        double newBalance = 0.0;
        String custName = "Customer";

        if (customer != null) {
            custName = customer.getName();
            previousBalance = customer.getKhataBalance() != null ? customer.getKhataBalance() : 0.0;
            newBalance = Math.max(0.0, Math.round((previousBalance - amount) * 100.0) / 100.0);
            customer.setKhataBalance(newBalance);
            userRepository.save(customer);

            final double finalBal = newBalance;
            storeAffiliationRepository.findByStoreIdAndUserId(1L, customer.getId()).ifPresent(aff -> {
                aff.setOutstandingKhataBalance(finalBal);
                storeAffiliationRepository.save(aff);
            });
        }

        try {
            storeHistoryService.recordLog(
                    1L,
                    "KHATA_PAYMENT",
                    "Khata Settlement: " + custName + " (₹" + amount + ")",
                    "Received ₹" + amount + " via " + (req.getPaymentMode() != null ? req.getPaymentMode() : "CASH") + ". New balance: ₹" + newBalance + (req.getNotes() != null ? " Notes: " + req.getNotes() : ""),
                    req.getReceivedBy() != null ? req.getReceivedBy() : "Counter 1",
                    "KHATA-RCV-" + (System.currentTimeMillis() % 100000),
                    amount
            );
        } catch (Exception ex) {
            log.warn("Failed recording khata payment history log: {}", ex.getMessage());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("customerName", custName);
        response.put("amountPaid", amount);
        response.put("previousBalance", previousBalance);
        response.put("newBalance", newBalance);
        response.put("paymentMode", req.getPaymentMode() != null ? req.getPaymentMode() : "CASH");
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }

    public List<Map<String, Object>> getScheduleH1Register() {
        List<Invoice> invoices = invoiceRepository.findByHasScheduleHTrueOrderByTimestampDesc();
        List<Map<String, Object>> records = new ArrayList<>();
        for (Invoice inv : invoices) {
            if (inv.getItems() == null) continue;
            for (InvoiceItem item : inv.getItems()) {
                Medicine med = item.getMedicineId() != null ? medicineRepository.findById(item.getMedicineId()).orElse(null) : null;
                boolean isH1 = med != null && (Boolean.TRUE.equals(med.getIsScheduleH1()) || Boolean.TRUE.equals(med.getIsScheduleH()) || Boolean.TRUE.equals(med.getIsNarcotic()));
                if (isH1 || Boolean.TRUE.equals(inv.getHasScheduleH())) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("invoiceNumber", inv.getInvoiceNumber());
                    row.put("timestamp", inv.getTimestamp());
                    row.put("customerName", inv.getCustomerName());
                    row.put("customerPhone", inv.getCustomerPhone());
                    row.put("doctorName", inv.getDoctorName());
                    row.put("doctorRegNo", inv.getDoctorRegNo());
                    row.put("medicineName", item.getMedicineName());
                    row.put("genericName", item.getGenericName());
                    row.put("batchNumber", item.getBatchNumber());
                    row.put("expiryDate", item.getExpiryDate());
                    row.put("quantity", item.getQuantity());
                    row.put("dispensedBy", inv.getDispensedBy());
                    String sched = "Schedule H";
                    if (med != null && Boolean.TRUE.equals(med.getIsScheduleH1())) sched = "Schedule H1";
                    else if (med != null && Boolean.TRUE.equals(med.getIsNarcotic())) sched = "Narcotic";
                    row.put("scheduleType", sched);
                    records.add(row);
                }
            }
        }
        return records;
    }
}
