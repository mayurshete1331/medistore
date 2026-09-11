package com.medi.app.service;

import com.medi.app.dto.MedicineDtos;
import com.medi.app.entity.Batch;
import com.medi.app.entity.Medicine;
import com.medi.app.exception.InsufficientStockException;
import com.medi.app.exception.ResourceNotFoundException;
import com.medi.app.repository.BatchRepository;
import com.medi.app.repository.MedicineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final MedicineRepository medicineRepository;
    private final BatchRepository batchRepository;

    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    public List<Medicine> searchMedicines(String query) {
        if (query == null || query.trim().isEmpty()) {
            return medicineRepository.findAll();
        }
        return medicineRepository.searchMedicines(query.trim());
    }

    public List<Medicine> getMedicinesByCategory(String category) {
        if ("ALL".equalsIgnoreCase(category)) {
            return medicineRepository.findAll();
        }
        return medicineRepository.findByCategory(category);
    }

    public List<Medicine> getLowStockMedicines() {
        return medicineRepository.findLowStockMedicines();
    }

    public Medicine getMedicineById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + id));
    }

    public List<Batch> getFefoBatches(Long medicineId) {
        return batchRepository.findFefoBatchesForMedicine(medicineId);
    }

    @Transactional
    public Medicine addMedicine(MedicineDtos.CreateMedicineRequest req) {
        Medicine medicine = Medicine.builder()
                .brandName(req.getBrandName().trim())
                .genericName(req.getGenericName().trim())
                .category(req.getCategory())
                .manufacturer(req.getManufacturer())
                .hsnCode(req.getHsnCode())
                .gstRate(req.getGstRate())
                .packaging(req.getPackaging())
                .unitsPerPack(req.getUnitsPerPack() != null ? req.getUnitsPerPack() : 1)
                .unitLabel(req.getUnitLabel() != null ? req.getUnitLabel() : "Unit")
                .rackLocation(req.getRackLocation())
                .isScheduleH(Boolean.TRUE.equals(req.getIsScheduleH()))
                .isScheduleH1(Boolean.TRUE.equals(req.getIsScheduleH1()))
                .isNarcotic(Boolean.TRUE.equals(req.getIsNarcotic()))
                .reorderLevel(req.getReorderLevel() != null ? req.getReorderLevel() : 10)
                .defaultReorderQty(req.getDefaultReorderQty() != null ? req.getDefaultReorderQty() : 20)
                .build();

        Medicine savedMedicine = medicineRepository.save(medicine);

        // Add Initial Batch
        if (req.getInitialBatch() != null) {
            Batch batch = Batch.builder()
                    .batchNumber(req.getInitialBatch().getBatchNumber().toUpperCase().trim())
                    .mfgDate(req.getInitialBatch().getMfgDate())
                    .expiryDate(req.getInitialBatch().getExpiryDate())
                    .purchasePrice(req.getInitialBatch().getPurchasePrice())
                    .mrp(req.getInitialBatch().getMrp())
                    .salePrice(req.getInitialBatch().getSalePrice())
                    .stockPacks(req.getInitialBatch().getStockPacks())
                    .medicine(savedMedicine)
                    .build();

            batchRepository.save(batch);
            savedMedicine.getBatches().add(batch);
        }

        return savedMedicine;
    }

    @Transactional
    public Batch addBatch(Long medicineId, MedicineDtos.AddBatchRequest req) {
        Medicine medicine = getMedicineById(medicineId);

        Batch batch = Batch.builder()
                .batchNumber(req.getBatchNumber().toUpperCase().trim())
                .mfgDate(req.getMfgDate())
                .expiryDate(req.getExpiryDate())
                .purchasePrice(req.getPurchasePrice())
                .mrp(req.getMrp())
                .salePrice(req.getSalePrice())
                .stockPacks(req.getStockPacks())
                .medicine(medicine)
                .build();

        return batchRepository.save(batch);
    }

    @Transactional
    public void deductStock(Long batchId, Integer packsToDeduct) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        if (batch.getVersion() == null) {
            batch.setVersion(0L);
        }

        if (batch.getStockPacks() < packsToDeduct) {
            throw new InsufficientStockException("Insufficient stock in batch " + batch.getBatchNumber() + 
                    ". Requested: " + packsToDeduct + ", Available: " + batch.getStockPacks());
        }

        int newStock = Math.max(0, batch.getStockPacks() - packsToDeduct);
        batch.setStockPacks(newStock);
        batchRepository.save(batch);
    }

    @Transactional
    public void restockMedicine(Long medicineId, Integer packs) {
        List<Batch> batches = batchRepository.findByMedicineId(medicineId);
        if (!batches.isEmpty()) {
            Batch batch = batches.get(0);
            if (batch.getVersion() == null) {
                batch.setVersion(0L);
            }
            batch.setStockPacks(batch.getStockPacks() + packs);
            batchRepository.save(batch);
        }
    }
}
