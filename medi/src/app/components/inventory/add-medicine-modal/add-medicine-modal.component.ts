import { Component, EventEmitter, Output, Input, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, switchMap, of, tap } from 'rxjs';
import { InventoryService } from '../../../core/services/inventory.service';
import { DrugLookupService, DrugSuggestion } from '../../../core/services/drug-lookup.service';
import { Medicine, MedicineCategory } from '../../../core/models/medicine.model';

@Component({
  selector: 'app-add-medicine-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-medicine-modal.component.html',
  styleUrls: ['./add-medicine-modal.component.scss']
})
export class AddMedicineModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private drugLookupService = inject(DrugLookupService);

  @Input() initialBrandName: string = '';
  @Output() closed = new EventEmitter<void>();
  @Output() medicineAdded = new EventEmitter<Medicine>();

  categories = this.inventoryService.categories;

  // Auto-suggest state
  suggestions = signal<DrugSuggestion[]>([]);
  isLoading = signal<boolean>(false);
  showSuggestions = signal<boolean>(false);
  selectedSuggestionIndex = signal<number>(-1);
  quickPresets = signal<DrugSuggestion[]>([]);
  lastAutoFilledDrug = signal<DrugSuggestion | null>(null);

  private brandSub?: Subscription;
  private isSelecting = false;

  medicineForm: FormGroup = this.fb.group({
    brandName: ['', [Validators.required, Validators.minLength(2)]],
    genericName: ['', [Validators.required, Validators.minLength(3)]],
    category: ['Tablet' as MedicineCategory, Validators.required],
    manufacturer: ['', Validators.required],
    hsnCode: ['', Validators.required],
    gstRate: [12, Validators.required],
    packaging: ['', Validators.required],
    unitsPerPack: [1, [Validators.required, Validators.min(1)]],
    unitLabel: ['Tab', Validators.required],
    rackLocation: ['', Validators.required],
    isScheduleH: [false],
    isScheduleH1: [false],
    isNarcotic: [false],
    reorderLevel: [10, [Validators.required, Validators.min(1)]],
    defaultReorderQty: [20, [Validators.required, Validators.min(1)]],

    // Initial Batch
    batchNumber: ['', [Validators.required, Validators.minLength(2)]],
    mfgDate: ['', Validators.required],
    expiryDate: ['', Validators.required],
    purchasePrice: [null, [Validators.required, Validators.min(0.1)]],
    mrp: [null, [Validators.required, Validators.min(0.1)]],
    salePrice: [null, [Validators.required, Validators.min(0.1)]],
    initialStockPacks: [null, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    if (this.initialBrandName) {
      this.medicineForm.patchValue({ brandName: this.initialBrandName.trim() });
    }

    // Load active medicines dynamically from database for quick-fill buttons
    this.drugLookupService.getQuickPresets().subscribe(presets => {
      this.quickPresets.set(presets);
    });

    // Reactive debounce search on typing brand name
    this.brandSub = this.medicineForm.get('brandName')?.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      tap(term => {
        if (!term || typeof term !== 'string' || term.trim().length < 2) {
          this.suggestions.set([]);
          this.showSuggestions.set(false);
          this.selectedSuggestionIndex.set(-1);
        }
      }),
      switchMap(term => {
        if (this.isSelecting || !term || typeof term !== 'string' || term.trim().length < 2) {
          return of([]);
        }
        this.isLoading.set(true);
        return this.drugLookupService.searchDrugs(term).pipe(
          tap(() => this.isLoading.set(false))
        );
      })
    ).subscribe({
      next: (results) => {
        if (!this.isSelecting) {
          this.suggestions.set(results);
          this.showSuggestions.set(results.length > 0);
          this.selectedSuggestionIndex.set(-1);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.brandSub?.unsubscribe();
  }

  /**
   * Auto-fill all 14 form fields when user clicks or selects a drug suggestion
   */
  selectSuggestion(drug: DrugSuggestion): void {
    this.isSelecting = true;

    // Generate smart FEFO batch prefix (e.g. AUG-2409, DOLO-2409)
    const brandPrefix = drug.brandName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'MED';
    const now = new Date();
    const batchYear = now.getFullYear().toString().slice(-2);
    const batchMonth = String(now.getMonth() + 1).padStart(2, '0');
    const autoBatch = `${brandPrefix}-${batchYear}${batchMonth}`;

    const currentBatch = this.medicineForm.get('batchNumber')?.value;
    const batchNumber = !currentBatch || currentBatch.length < 2 ? autoBatch : currentBatch;

    this.medicineForm.patchValue({
      brandName: drug.brandName,
      genericName: drug.genericName,
      category: drug.category,
      manufacturer: drug.manufacturer,
      hsnCode: drug.hsnCode,
      gstRate: drug.gstRate,
      packaging: drug.packaging,
      unitsPerPack: drug.unitsPerPack,
      unitLabel: drug.unitLabel,
      isScheduleH: drug.isScheduleH,
      isScheduleH1: drug.isScheduleH1,
      isNarcotic: drug.isNarcotic,
      reorderLevel: drug.reorderLevel,
      defaultReorderQty: drug.defaultReorderQty,
      purchasePrice: drug.purchasePrice ?? null,
      mrp: drug.mrp ?? null,
      salePrice: drug.salePrice ?? null,
      batchNumber: batchNumber
    });

    this.lastAutoFilledDrug.set(drug);
    this.suggestions.set([]);
    this.showSuggestions.set(false);
    this.selectedSuggestionIndex.set(-1);

    setTimeout(() => {
      this.isSelecting = false;
    }, 300);
  }

  onBrandFocus(): void {
    const val = this.medicineForm.get('brandName')?.value;
    if (val && typeof val === 'string' && val.trim().length >= 2 && this.suggestions().length > 0) {
      this.showSuggestions.set(true);
    }
  }

  onBrandBlur(): void {
    // Delay closing so that click events inside dropdown fire first
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 250);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showSuggestions() || this.suggestions().length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedSuggestionIndex.update(idx => 
        idx < this.suggestions().length - 1 ? idx + 1 : 0
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedSuggestionIndex.update(idx => 
        idx > 0 ? idx - 1 : this.suggestions().length - 1
      );
    } else if (event.key === 'Enter') {
      const idx = this.selectedSuggestionIndex();
      if (idx >= 0 && idx < this.suggestions().length) {
        event.preventDefault();
        this.selectSuggestion(this.suggestions()[idx]);
      }
    } else if (event.key === 'Escape') {
      this.showSuggestions.set(false);
      this.selectedSuggestionIndex.set(-1);
    }
  }

  clearAutoFilledNotice(): void {
    this.lastAutoFilledDrug.set(null);
  }

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
