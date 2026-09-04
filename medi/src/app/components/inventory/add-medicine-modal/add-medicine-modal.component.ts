import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { Medicine, MedicineCategory } from '../../../core/models/medicine.model';

@Component({
  selector: 'app-add-medicine-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-medicine-modal.component.html',
  styleUrls: ['./add-medicine-modal.component.scss']
})
export class AddMedicineModalComponent {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);

  @Output() closed = new EventEmitter<void>();
  @Output() medicineAdded = new EventEmitter<Medicine>();

  categories = this.inventoryService.categories;

  medicineForm: FormGroup = this.fb.group({
    brandName: ['', [Validators.required, Validators.minLength(2)]],
    genericName: ['', [Validators.required, Validators.minLength(3)]],
    category: ['Tablet' as MedicineCategory, Validators.required],
    manufacturer: ['', Validators.required],
    hsnCode: ['30049099', Validators.required],
    gstRate: [12, Validators.required],
    packaging: ['10 Tablets/Strip', Validators.required],
    unitsPerPack: [10, [Validators.required, Validators.min(1)]],
    unitLabel: ['Tab', Validators.required],
    rackLocation: ['Rack A-01', Validators.required],
    isScheduleH: [false],
    isScheduleH1: [false],
    isNarcotic: [false],
    reorderLevel: [20, [Validators.required, Validators.min(1)]],
    defaultReorderQty: [50, [Validators.required, Validators.min(1)]],

    // Initial Batch
    batchNumber: ['', [Validators.required, Validators.minLength(2)]],
    mfgDate: ['2024-01', Validators.required],
    expiryDate: ['2026-06', Validators.required],
    purchasePrice: [100.0, [Validators.required, Validators.min(0.1)]],
    mrp: [150.0, [Validators.required, Validators.min(0.1)]],
    salePrice: [145.0, [Validators.required, Validators.min(0.1)]],
    initialStockPacks: [30, [Validators.required, Validators.min(1)]]
  });

  onSubmit(): void {
    if (this.medicineForm.invalid) {
      this.medicineForm.markAllAsTouched();
      return;
    }

    const val = this.medicineForm.value;

    const newMed = this.inventoryService.addMedicine({
      brandName: val.brandName,
      genericName: val.genericName,
      category: val.category,
      manufacturer: val.manufacturer,
      hsnCode: val.hsnCode,
      gstRate: val.gstRate,
      packaging: val.packaging,
      unitsPerPack: val.unitsPerPack,
      unitLabel: val.unitLabel,
      rackLocation: val.rackLocation,
      isScheduleH: val.isScheduleH,
      isScheduleH1: val.isScheduleH1,
      isNarcotic: val.isNarcotic,
      reorderLevel: val.reorderLevel,
      defaultReorderQty: val.defaultReorderQty,
      initialBatch: {
        batchNumber: val.batchNumber,
        mfgDate: val.mfgDate,
        expiryDate: val.expiryDate,
        purchasePrice: val.purchasePrice,
        mrp: val.mrp,
        salePrice: val.salePrice,
        stockPacks: val.initialStockPacks
      }
    });

    this.medicineAdded.emit(newMed);
    this.closed.emit();
  }

  onCategoryChange(cat: MedicineCategory): void {
    if (cat === 'Syrup' || cat === 'Drops') {
      this.medicineForm.patchValue({
        packaging: '100ml Bottle',
        unitsPerPack: 1,
        unitLabel: 'Bottle'
      });
    } else if (cat === 'Injection') {
      this.medicineForm.patchValue({
        packaging: '1 Vial + WFI',
        unitsPerPack: 1,
        unitLabel: 'Vial'
      });
    } else if (cat === 'Inhaler') {
      this.medicineForm.patchValue({
        packaging: '200 MDI Canister',
        unitsPerPack: 1,
        unitLabel: 'Inhaler'
      });
    } else if (cat === 'Tablet' || cat === 'Capsule') {
      this.medicineForm.patchValue({
        packaging: '10 Tablets/Strip',
        unitsPerPack: 10,
        unitLabel: 'Tab'
      });
    }
  }
}
