package com.medi.app.service;

import com.medi.app.dto.BillingDtos;
import com.medi.app.entity.Invoice;
import com.medi.app.entity.InvoiceItem;
import com.medi.app.entity.User;
import com.medi.app.repository.InvoiceRepository;
import com.medi.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final InventoryService inventoryService;
    private final StoreHistoryService storeHistoryService;
    private final UserRepository userRepository;

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAllByOrderByTimestampDesc();
    }

    public Invoice getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceNumber));
    }

    @Transactional
    public Invoice checkout(BillingDtos.CheckoutRequest req) {
        LocalDateTime now = LocalDateTime.now();
        String invoiceNumber = "INV-" + now.getYear() + "-" + String.format("%04d", invoiceRepository.count() + 1);

        double subtotal = 0.0;
        double totalDiscount = 0.0;
        double totalTax = 0.0;
        double totalCostPrice = 0.0;
        boolean hasScheduleH = false;

        List<InvoiceItem> invoiceItems = new ArrayList<>();

        for (BillingDtos.CartItemDto itemDto : req.getItems()) {
            double gross = itemDto.getQuantity() * itemDto.getUnitPrice();
            double discountAmt = (gross * (itemDto.getDiscountPercent() != null ? itemDto.getDiscountPercent() : 0)) / 100.0;
            double lineSubtotal = gross - discountAmt;
            double lineTax = (lineSubtotal * (itemDto.getGstRate() != null ? itemDto.getGstRate() : 0)) / 100.0;
            double lineTotal = lineSubtotal + lineTax;

            subtotal += lineSubtotal;
            totalDiscount += discountAmt;
            totalTax += lineTax;
            totalCostPrice += (itemDto.getCostPrice() != null ? itemDto.getCostPrice() : 0) * itemDto.getQuantity();

            InvoiceItem invoiceItem = InvoiceItem.builder()
                    .medicineId(itemDto.getMedicineId())
                    .medicineName(itemDto.getMedicineName())
                    .genericName(itemDto.getGenericName())
                    .batchNumber(itemDto.getBatchNumber())
                    .expiryDate(itemDto.getExpiryDate())
                    .hsnCode(itemDto.getHsnCode())
                    .saleType(itemDto.getSaleType())
                    .quantity(itemDto.getQuantity())
                    .unitPrice(itemDto.getUnitPrice())
                    .mrp(itemDto.getMrp())
                    .costPrice(itemDto.getCostPrice())
                    .discountPercent(itemDto.getDiscountPercent())
                    .gstRate(itemDto.getGstRate())
                    .taxAmount(Math.round(lineTax * 100.0) / 100.0)
                    .subtotal(Math.round(lineSubtotal * 100.0) / 100.0)
                    .total(Math.round(lineTotal * 100.0) / 100.0)
                    .build();

            invoiceItems.add(invoiceItem);

            // Deduct stock
            if (itemDto.getBatchId() != null) {
                int packsDeduct = "FULL_PACK".equals(itemDto.getSaleType()) ? itemDto.getQuantity() : 1;
                inventoryService.deductStock(itemDto.getBatchId(), packsDeduct);
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
                .customerName(req.getCustomer() != null && req.getCustomer().getName() != null ? req.getCustomer().getName() : "Walk-in Customer")
                .customerPhone(req.getCustomer() != null ? req.getCustomer().getPhone() : "")
                .doctorName(req.getCustomer() != null ? req.getCustomer().getDoctorName() : "")
                .doctorRegNo(req.getCustomer() != null ? req.getCustomer().getDoctorRegNo() : "")
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
                .build();

        for (InvoiceItem item : invoiceItems) {
            item.setInvoice(invoice);
        }
        Invoice saved = invoiceRepository.save(invoice);

        // Record in Store History
        storeHistoryService.recordLog(
                1L,
                "SALE_BILLING",
                "Counter POS Bill: " + saved.getInvoiceNumber(),
                "Invoice " + saved.getInvoiceNumber() + " billed for ₹" + saved.getGrandTotal() + " (" + saved.getItems().size() + " items, " + saved.getPaymentMode() + ") to " + saved.getCustomerName() + ".",
                saved.getDispensedBy(),
                saved.getInvoiceNumber(),
                saved.getGrandTotal()
        );

        return saved;
    }

    public List<Map<String, Object>> lookupCustomers(String query) {
        String cleanQuery = query != null ? query.trim() : "";
        String cleanDigits = cleanQuery.replaceAll("\\D", "");

        List<Map<String, Object>> results = new ArrayList<>();
        Set<String> seenPhones = new HashSet<>();

        // 1. Search registered Users with role CUSTOMER
        List<User> matchedUsers = userRepository.searchCustomers(cleanQuery, cleanDigits);
        for (User u : matchedUsers) {
            String p = u.getPhone() != null ? u.getPhone().replaceAll("\\D", "") : "";
            if (!p.isEmpty() && seenPhones.contains(p)) continue;
            if (!p.isEmpty()) seenPhones.add(p);

            List<Invoice> pastInvs = u.getPhone() != null && !u.getPhone().isEmpty()
                    ? invoiceRepository.findByCustomerPhoneContainingOrderByTimestampDesc(u.getPhone())
                    : invoiceRepository.findByCustomerNameContainingIgnoreCaseOrderByTimestampDesc(u.getName());

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
        List<Invoice> invoiceMatches = !cleanDigits.isEmpty() && cleanDigits.length() >= 4
                ? invoiceRepository.findByCustomerPhoneContainingOrderByTimestampDesc(cleanDigits)
                : invoiceRepository.findByCustomerNameContainingIgnoreCaseOrderByTimestampDesc(cleanQuery);

        for (Invoice inv : invoiceMatches) {
            String p = inv.getCustomerPhone() != null ? inv.getCustomerPhone().replaceAll("\\D", "") : "";
            if (inv.getCustomerName() != null && "walk-in customer".equalsIgnoreCase(inv.getCustomerName().trim()) && p.isEmpty()) {
                continue;
            }
            if (!p.isEmpty() && seenPhones.contains(p)) {
                continue;
            }
            if (!p.isEmpty()) seenPhones.add(p);

            List<Invoice> pastInvs = !p.isEmpty()
                    ? invoiceRepository.findByCustomerPhoneContainingOrderByTimestampDesc(inv.getCustomerPhone())
                    : invoiceRepository.findByCustomerNameContainingIgnoreCaseOrderByTimestampDesc(inv.getCustomerName());

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
        if (!cleanPhone.isEmpty() && cleanPhone.length() >= 4) {
            return invoiceRepository.findByCustomerPhoneContainingOrderByTimestampDesc(cleanPhone);
        }
        if (name != null && !name.trim().isEmpty() && !"walk-in customer".equalsIgnoreCase(name.trim())) {
            return invoiceRepository.findByCustomerNameContainingIgnoreCaseOrderByTimestampDesc(name.trim());
        }
        return Collections.emptyList();
    }
}
