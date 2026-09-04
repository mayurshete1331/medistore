package com.medi.app.controller;

import com.medi.app.dto.MedicineDtos;
import com.medi.app.entity.Batch;
import com.medi.app.entity.Medicine;
import com.medi.app.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
@RequiredArgsConstructor
@Tag(name = "Medicine Catalog & Inventory", description = "Drug Master, Batch tracking, and FEFO allocation")
public class MedicineController {

    private final InventoryService inventoryService;

    @GetMapping
    @Operation(summary = "Search or filter medicines by brand, generic salt, or category")
    public ResponseEntity<List<Medicine>> getMedicines(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category) {

        if (category != null && !category.trim().isEmpty() && !"ALL".equalsIgnoreCase(category)) {
            return ResponseEntity.ok(inventoryService.getMedicinesByCategory(category));
        }
        return ResponseEntity.ok(inventoryService.searchMedicines(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single medicine details by ID")
    public ResponseEntity<Medicine> getMedicineById(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getMedicineById(id));
    }

    @GetMapping("/{id}/fefo-batches")
    @Operation(summary = "Get active batches for a medicine ordered by earliest expiry (FEFO)")
    public ResponseEntity<List<Batch>> getFefoBatches(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getFefoBatches(id));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get all medicines with current stock at or below reorder threshold")
    public ResponseEntity<List<Medicine>> getLowStockMedicines() {
        return ResponseEntity.ok(inventoryService.getLowStockMedicines());
    }

    @PostMapping
    @Operation(summary = "Add a new medicine and initial batch to the Master Catalog")
    public ResponseEntity<Medicine> addMedicine(@Valid @RequestBody MedicineDtos.CreateMedicineRequest req) {
        Medicine created = inventoryService.addMedicine(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/batches")
    @Operation(summary = "Add an inward stock batch to an existing medicine")
    public ResponseEntity<Batch> addBatch(
            @PathVariable Long id,
            @Valid @RequestBody MedicineDtos.AddBatchRequest req) {
        Batch batch = inventoryService.addBatch(id, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(batch);
    }
}
