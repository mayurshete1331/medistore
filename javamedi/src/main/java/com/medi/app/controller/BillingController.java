package com.medi.app.controller;

import com.medi.app.dto.BillingDtos;
import com.medi.app.entity.Invoice;
import com.medi.app.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
@Tag(name = "Counter POS & Invoicing", description = "High-speed Counter Billing, Tax math, and Invoices")
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/invoices")
    @Operation(summary = "Get all past sales invoices")
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(billingService.getAllInvoices());
    }

    @GetMapping("/invoices/{invoiceNumber}")
    @Operation(summary = "Get invoice by invoice number for thermal re-print")
    public ResponseEntity<Invoice> getInvoiceByNumber(@PathVariable String invoiceNumber) {
        return ResponseEntity.ok(billingService.getInvoiceByNumber(invoiceNumber));
    }

    @PostMapping("/checkout")
    @Operation(summary = "Process counter sale, deduct batch stock atomically, and generate tax invoice")
    public ResponseEntity<Invoice> checkout(@RequestBody BillingDtos.CheckoutRequest req) {
        Invoice invoice = billingService.checkout(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(invoice);
    }

    @GetMapping("/customers/lookup")
    @Operation(summary = "Search and verify customers by mobile number or name with past bills stats")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> lookupCustomers(@RequestParam String query) {
        return ResponseEntity.ok(billingService.lookupCustomers(query));
    }

    @GetMapping("/customers/invoices")
    @Operation(summary = "Fetch past invoices and medicines for a customer by phone or name")
    public ResponseEntity<List<Invoice>> getCustomerInvoices(
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String name) {
        return ResponseEntity.ok(billingService.getCustomerInvoices(phone, name));
    }
}
