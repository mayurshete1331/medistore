import { Injectable, signal, computed } from '@angular/core';
import { Medicine, Batch, MedicineCategory } from '../models/medicine.model';
import { INITIAL_MEDICINES } from '../data/initial-data';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly STORAGE_KEY = 'medi_inventory_v1';

  readonly medicines = signal<Medicine[]>(this.loadMedicines());

  readonly categories: MedicineCategory[] = [
    'Tablet',
    'Capsule',
    'Syrup',
    'Injection',
    'Ointment',
    'Drops',
    'Inhaler',
    'Surgical & Equipment'
  ];

  // Derived computed metrics
  readonly lowStockMedicines = computed(() => {
    return this.medicines().filter(m => m.totalStockPacks <= m.reorderLevel);
  });

  readonly outOfStockMedicines = computed(() => {
    return this.medicines().filter(m => m.totalStockPacks === 0);
  });

  readonly expiringSoonBatches = computed(() => {
    const today = new Date();
    const alertThresholdMonths = 6; // flag batches expiring within 6 months
    const thresholdDate = new Date();
    thresholdDate.setMonth(today.getMonth() + alertThresholdMonths);

    const expiring: { medicine: Medicine; batch: Batch; daysUntilExpiry: number }[] = [];

    this.medicines().forEach(med => {
      med.batches.forEach(b => {
        const expDate = new Date(b.expiryDate + '-01');
        if (expDate <= thresholdDate) {
          const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          expiring.push({ medicine: med, batch: b, daysUntilExpiry: diffDays });
        }
      });
    });

    return expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  });

  readonly totalValuation = computed(() => {
    return this.medicines().reduce((acc, med) => {
      const medValuation = med.batches.reduce((bAcc, b) => bAcc + (b.stockPacks * b.purchasePrice), 0);
      return acc + medValuation;
    }, 0);
  });

  private loadMedicines(): Medicine[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to read from localStorage, using initial medicines', e);
    }
    return INITIAL_MEDICINES;
  }

  private saveMedicines(meds: Medicine[]): void {
    this.medicines.set(meds);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(meds));
    } catch (e) {
      console.error('Failed to save medicines to localStorage', e);
    }
  }

  addMedicine(data: {
    brandName: string;
    genericName: string;
    category: MedicineCategory;
    manufacturer: string;
    hsnCode: string;
    gstRate: number;
    packaging: string;
    unitsPerPack: number;
    unitLabel: string;
    rackLocation: string;
    isScheduleH: boolean;
    isScheduleH1: boolean;
    isNarcotic: boolean;
    reorderLevel: number;
    defaultReorderQty: number;
    initialBatch: {
      batchNumber: string;
      mfgDate: string;
      expiryDate: string;
      purchasePrice: number;
      mrp: number;
      salePrice: number;
      stockPacks: number;
    };
  }): Medicine {
    const newBatch: Batch = {
      id: 'b-' + Date.now(),
      batchNumber: data.initialBatch.batchNumber.toUpperCase().trim(),
      mfgDate: data.initialBatch.mfgDate,
      expiryDate: data.initialBatch.expiryDate,
      purchasePrice: Number(data.initialBatch.purchasePrice),
      mrp: Number(data.initialBatch.mrp),
      salePrice: Number(data.initialBatch.salePrice),
      stockPacks: Number(data.initialBatch.stockPacks)
    };

    const newMedicine: Medicine = {
      id: 'med-' + Date.now(),
      brandName: data.brandName.trim(),
      genericName: data.genericName.trim(),
      category: data.category,
      manufacturer: data.manufacturer.trim(),
      hsnCode: data.hsnCode.trim(),
      gstRate: Number(data.gstRate),
      packaging: data.packaging.trim(),
      unitsPerPack: Number(data.unitsPerPack) || 1,
      unitLabel: data.unitLabel.trim() || 'Unit',
      rackLocation: data.rackLocation.trim(),
      isScheduleH: !!data.isScheduleH,
      isScheduleH1: !!data.isScheduleH1,
      isNarcotic: !!data.isNarcotic,
      reorderLevel: Number(data.reorderLevel) || 10,
      defaultReorderQty: Number(data.defaultReorderQty) || 20,
      batches: [newBatch],
      totalStockPacks: newBatch.stockPacks
    };

    const updated = [newMedicine, ...this.medicines()];
    this.saveMedicines(updated);
    return newMedicine;
  }

  addBatch(medicineId: string, batchData: Omit<Batch, 'id'>): void {
    const updated = this.medicines().map(med => {
      if (med.id !== medicineId) return med;

      const newBatch: Batch = {
        id: 'b-' + Date.now(),
        ...batchData
      };
      const batches = [...med.batches, newBatch];
      const totalStockPacks = batches.reduce((sum, b) => sum + b.stockPacks, 0);

      return {
        ...med,
        batches,
        totalStockPacks
      };
    });

    this.saveMedicines(updated);
  }

  deductStock(medicineId: string, batchId: string, packsToDeduct: number): void {
    const updated = this.medicines().map(med => {
      if (med.id !== medicineId) return med;

      const batches = med.batches.map(b => {
        if (b.id !== batchId) return b;
        const newStock = Math.max(0, b.stockPacks - packsToDeduct);
        return { ...b, stockPacks: newStock };
      });

      const totalStockPacks = batches.reduce((sum, b) => sum + b.stockPacks, 0);
      return { ...med, batches, totalStockPacks };
    });

    this.saveMedicines(updated);
  }

  restockMedicine(medicineId: string, additionalPacks: number): void {
    const updated = this.medicines().map(med => {
      if (med.id !== medicineId) return med;

      // Restock the latest or first active batch
      const batches = [...med.batches];
      if (batches.length > 0) {
        batches[0] = {
          ...batches[0],
          stockPacks: batches[0].stockPacks + additionalPacks
        };
      }
      const totalStockPacks = batches.reduce((sum, b) => sum + b.stockPacks, 0);
      return { ...med, batches, totalStockPacks };
    });

    this.saveMedicines(updated);
  }

  resetToDefault(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.medicines.set(INITIAL_MEDICINES);
  }
}
