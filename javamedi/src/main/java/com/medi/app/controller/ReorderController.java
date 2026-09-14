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
    private final com.medi.app.service.EmailNotificationService emailNotificationService;
    private final com.medi.app.repository.MedicineRepository medicineRepository;
    private final com.medi.app.repository.SupplierRepository supplierRepository;

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

    @PostMapping("/suppliers")
    @Operation(summary = "Add a new distributor or supplier")
    public ResponseEntity<Supplier> addSupplier(@RequestBody Supplier supplier) {
        return ResponseEntity.ok(reorderService.saveSupplier(supplier));
    }

    @PutMapping("/suppliers/{id}")
    @Operation(summary = "Update distributor details including WhatsApp number and Email ID")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable Long id, @RequestBody Supplier supplier) {
        supplier.setId(id);
        return ResponseEntity.ok(reorderService.saveSupplier(supplier));
    }

    @DeleteMapping("/suppliers/{id}")
    @Operation(summary = "Delete distributor")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        reorderService.deleteSupplier(id);
        return ResponseEntity.noContent().build();
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

    @PostMapping("/send-email-po/{medicineId}")
    @Operation(summary = "Send actual Purchase Order via Gmail SMTP to distributor and admin email")
    public ResponseEntity<Map<String, String>> sendEmailPO(
            @PathVariable Long medicineId,
            @RequestParam(required = false) Integer customQty,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String notes) {

        Medicine med = medicineRepository.findById(medicineId).orElse(null);
        if (med == null) return ResponseEntity.notFound().build();

        Supplier sup = supplierId != null
                ? supplierRepository.findById(supplierId).orElseGet(() -> supplierRepository.findAll().stream().findFirst().orElse(null))
                : supplierRepository.findAll().stream().findFirst().orElse(null);

        String supplierEmail = sup != null ? sup.getEmail() : "orders@distributor.com";
        int qty = customQty != null ? customQty : med.getDefaultReorderQty();
        double estPrice = med.getBatches().isEmpty() ? 100.0 : med.getBatches().get(0).getPurchasePrice();
        double total = qty * estPrice;

        emailNotificationService.sendPurchaseOrderEmail(supplierEmail, med.getBrandName(), qty, total, notes);
        return ResponseEntity.ok(Map.of("message", "Purchase Order dispatched via Gmail SMTP successfully"));
    }
}
