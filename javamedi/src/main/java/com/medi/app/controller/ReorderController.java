package com.medi.app.controller;

import com.medi.app.entity.Medicine;
import com.medi.app.entity.Supplier;
import com.medi.app.service.ReorderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reorder")
@RequiredArgsConstructor
@Tag(name = "Automated Procurement & Reorder", description = "Low-stock detection and WhatsApp / Email PO generation")
public class ReorderController {

    private final ReorderService reorderService;

    @GetMapping("/low-stock")
    @Operation(summary = "Get all medicines currently below their reorder threshold")
    public ResponseEntity<List<Medicine>> getLowStockMedicines() {
        return ResponseEntity.ok(reorderService.getLowStockMedicines());
    }

    @GetMapping("/suppliers")
    @Operation(summary = "Get list of registered distributors and suppliers")
    public ResponseEntity<List<Supplier>> getSuppliers() {
        return ResponseEntity.ok(reorderService.getAllSuppliers());
    }

    @GetMapping("/whatsapp-url/{medicineId}")
    @Operation(summary = "Generate pre-filled WhatsApp Purchase Order URL with owner authorization")
    public ResponseEntity<Map<String, String>> getWhatsAppUrl(
            @PathVariable Long medicineId,
            @RequestParam(required = false) Integer customQty,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String notes) {

        String url = reorderService.generateWhatsAppUrl(medicineId, customQty, supplierId, notes);
        return ResponseEntity.ok(Map.of("whatsappUrl", url));
    }

    @GetMapping("/email-url/{medicineId}")
    @Operation(summary = "Generate pre-filled Email Purchase Order URL with owner authorization")
    public ResponseEntity<Map<String, String>> getEmailUrl(
            @PathVariable Long medicineId,
            @RequestParam(required = false) Integer customQty,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String notes) {

        String url = reorderService.generateEmailUrl(medicineId, customQty, supplierId, notes);
        return ResponseEntity.ok(Map.of("emailUrl", url));
    }
}
