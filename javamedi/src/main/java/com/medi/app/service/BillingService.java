package com.medi.app.service;

import com.medi.app.dto.BillingDtos;
import com.medi.app.entity.Invoice;
import com.medi.app.entity.InvoiceItem;
import com.medi.app.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final InventoryService inventoryService;
    private final StoreHistoryService storeHistoryService;

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
}
