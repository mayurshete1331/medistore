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

    public List<Medicine> getAllMedicines(Long storeId) {
        if (storeId != null) {
            return medicineRepository.findByStoreId(storeId);
        }
        return medicineRepository.findAll();
    }

    public List<Medicine> searchMedicines(Long storeId, String query) {
        if (storeId != null) {
            if (query == null || query.trim().isEmpty()) {
                return medicineRepository.findByStoreId(storeId);
            }
            return medicineRepository.searchMedicinesByStore(storeId, query.trim());
        }
        if (query == null || query.trim().isEmpty()) {
            return medicineRepository.findAll();
        }
        return medicineRepository.searchMedicines(query.trim());
    }

    public List<Medicine> getMedicinesByCategory(Long storeId, String category) {
        if ("ALL".equalsIgnoreCase(category)) {
            return getAllMedicines(storeId);
        }
        if (storeId != null) {
            return medicineRepository.findByStoreIdAndCategory(storeId, category);
        }
        return medicineRepository.findByCategory(category);
    }

    public List<Medicine> getLowStockMedicines(Long storeId) {
        if (storeId != null) {
            return medicineRepository.findLowStockMedicinesByStore(storeId);
        }
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
        Long targetStoreId = req.getStoreId() != null ? req.getStoreId() : 1L;

        Medicine medicine = Medicine.builder()
                .storeId(targetStoreId)
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
        deductStock(batchId, "FULL_PACK", packsToDeduct, 1);
    }

    @Transactional
    public void deductStock(Long batchId, String saleType, Integer quantity, Integer unitsPerPack) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        if (batch.getVersion() == null) {
            batch.setVersion(0L);
        }
        if (batch.getLooseUnits() == null) {
            batch.setLooseUnits(0);
        }

        int upp = (unitsPerPack != null && unitsPerPack > 1) ? unitsPerPack : 1;
        int qty = (quantity != null && quantity > 0) ? quantity : 1;

        if ("LOOSE_TABLETS".equalsIgnoreCase(saleType) || "UNIT".equalsIgnoreCase(saleType)) {
            if (upp <= 1) {
                if (batch.getStockPacks() < qty) {
                    throw new InsufficientStockException("Insufficient stock in batch " + batch.getBatchNumber());
                }
                batch.setStockPacks(batch.getStockPacks() - qty);
            } else {
                if (batch.getLooseUnits() >= qty) {
                    batch.setLooseUnits(batch.getLooseUnits() - qty);
                } else {
                    int neededFromPacks = qty - batch.getLooseUnits();
                    int packsToBreak = (int) Math.ceil((double) neededFromPacks / upp);
                    if (batch.getStockPacks() < packsToBreak) {
                        throw new InsufficientStockException("Insufficient stock in batch " + batch.getBatchNumber() +
                                ". Need " + packsToBreak + " packs to satisfy " + qty + " loose units, but only " + batch.getStockPacks() + " available.");
                    }
                    batch.setStockPacks(batch.getStockPacks() - packsToBreak);
                    batch.setLooseUnits(batch.getLooseUnits() + (packsToBreak * upp) - qty);
                }
            }
        } else {
            if (batch.getStockPacks() < qty) {
                throw new InsufficientStockException("Insufficient stock in batch " + batch.getBatchNumber() + 
                        ". Requested: " + qty + ", Available: " + batch.getStockPacks());
            }
            batch.setStockPacks(batch.getStockPacks() - qty);
        }

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

    @Transactional
    public void replenishStock(Long batchId, String saleType, Integer quantity, Integer unitsPerPack) {
        if (batchId == null || quantity == null || quantity <= 0) return;
        Batch batch = batchRepository.findById(batchId).orElse(null);
        if (batch == null) return;
        if (batch.getVersion() == null) batch.setVersion(0L);
        if (batch.getLooseUnits() == null) batch.setLooseUnits(0);

        int upp = (unitsPerPack != null && unitsPerPack > 1) ? unitsPerPack : 1;
        if ("LOOSE_TABLETS".equalsIgnoreCase(saleType) || "UNIT".equalsIgnoreCase(saleType)) {
            if (upp <= 1) {
                batch.setStockPacks(batch.getStockPacks() + quantity);
            } else {
                int totalLoose = batch.getLooseUnits() + quantity;
                int fullPacksFromLoose = totalLoose / upp;
                int remainingLoose = totalLoose % upp;
                batch.setStockPacks(batch.getStockPacks() + fullPacksFromLoose);
                batch.setLooseUnits(remainingLoose);
            }
        } else {
            batch.setStockPacks(batch.getStockPacks() + quantity);
        }
        batchRepository.save(batch);
    }
}
