import { Component, EventEmitter, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { AuthService } from '../../../core/services/auth.service';

export interface InwardTableItem {
  medicineName: string;
  genericName?: string;
  mfr?: string;
  packaging?: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  mrp: number;
  salePrice: number;
  discount?: number;
  gstRate: number;
  hsnCode?: string;
  category?: string;
  rackLocation?: string;
  existingMedicineId?: number | null;
  isExisting?: boolean;
  matchedBrandName?: string;
}

@Component({
  selector: 'app-purchase-inward-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-inward-modal.component.html',
  styleUrls: ['./purchase-inward-modal.component.scss']
})
export class PurchaseInwardModalComponent {
  private apiService = inject(ApiService);
  private inventoryService = inject(InventoryService);
  private authService = inject(AuthService);

  @Output() closed = new EventEmitter<void>();
  @Output() stockImported = new EventEmitter<any>();

  currentStep = signal<'UPLOAD' | 'REVIEW' | 'SUCCESS'>('UPLOAD');
  selectedFile = signal<File | null>(null);
  isDragging = signal(false);
  isParsing = signal(false);
  isCommitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Extracted & Editable Inward Bill Details
  distributorName = signal('');
  invoiceNumber = signal('');
  invoiceDate = signal(new Date().toISOString().split('T')[0]);
  items = signal<InwardTableItem[]>([]);
  commitResult = signal<any | null>(null);

  // Computed Summaries
  totalItemsCount = computed(() => this.items().length);
  totalPacksCount = computed(() =>
    this.items().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  );

  totalValuation = computed(() =>
    this.items().reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.purchasePrice) || 0;
      const disc = Number(item.discount) || 0;
      const gst = Number(item.gstRate) || 0;
      const base = qty * rate * (1 - disc / 100);
      return sum + base * (1 + gst / 100);
    }, 0)
  );

  existingMedicinesCount = computed(() =>
    this.items().filter(item => item.isExisting).length
  );
  newMedicinesCount = computed(() =>
    this.items().filter(item => !item.isExisting).length
  );

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    this.selectedFile.set(file);
    this.errorMessage.set(null);
  }

  clearFile(): void {
    this.selectedFile.set(null);
    this.errorMessage.set(null);
  }

  openManualEntry(): void {
    this.items.set([]);
    this.addNewItem();
    this.currentStep.set('REVIEW');
  }

  /**
   * Trigger backend Java PDFBox / OCR parser on the uploaded file
   */
  parseUploadedBill(): void {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Please select or drop a purchase bill PDF or Image first.');
      return;
    }

    this.isParsing.set(true);
    this.errorMessage.set(null);

    this.apiService.parsePurchaseBill(file).subscribe({
      next: (res) => {
        this.isParsing.set(false);
        if (!res || !res.items || res.items.length === 0) {
          this.errorMessage.set(res?.message || 'No medicine rows detected from document. You can add items manually in the grid.');
          this.items.set([]);
          this.addNewItem();
          this.currentStep.set('REVIEW');
          return;
        }
        this.applyParsedResponse(res);
      },
      error: (err) => {
        this.isParsing.set(false);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage.set('Your session has expired. Please log out and log in again to continue.');
          this.authService.logout();
        } else {
          this.errorMessage.set('Could not extract text from document: ' + (err.error?.message || err.message || 'Unknown error') + '. Please enter items manually.');
          this.items.set([]);
          this.addNewItem();
          this.currentStep.set('REVIEW');
        }
      }
    });
  }

  private applyParsedResponse(res: any): void {
    this.distributorName.set(res.distributorName || '');
    this.invoiceNumber.set(res.invoiceNumber || ('INV-' + Math.floor(Math.random() * 90000 + 10000)));
    this.invoiceDate.set(res.invoiceDate || new Date().toISOString().split('T')[0]);

    const mappedItems: InwardTableItem[] = (res.items || []).map((i: any) => ({
      medicineName: i.medicineName,
      genericName: i.genericName || i.medicineName,
      mfr: i.mfr || '',
      packaging: i.packaging || "10'S",
      batchNumber: i.batchNumber || ('B' + Math.floor(Math.random() * 90000 + 10000)),
      expiryDate: i.expiryDate || '2028-06',
      quantity: Number(i.quantity) || 1,
      purchasePrice: Number(i.purchasePrice) || 20.0,
      mrp: Number(i.mrp) || Math.round((Number(i.purchasePrice) || 20) * 1.35 * 100) / 100,
      salePrice: Number(i.salePrice) || Math.round((Number(i.mrp) || 27) * 0.95 * 100) / 100,
      discount: Number(i.discount) || 0,
      gstRate: Number(i.gstRate) || 5,
      hsnCode: i.hsnCode || '30049039',
      category: i.category || 'Tablet',
      rackLocation: i.rackLocation || 'Rack A-01',
      existingMedicineId: i.existingMedicineId || null,
      isExisting: !!i.isExisting,
      matchedBrandName: i.matchedBrandName || ''
    }));

    this.items.set(mappedItems);
    this.currentStep.set('REVIEW');
  }

  updateItem(index: number, field: keyof InwardTableItem, value: any): void {
    const list = [...this.items()];
    if (list[index]) {
      list[index] = { ...list[index], [field]: value };
      this.items.set(list);
    }
  }

  removeItem(index: number): void {
    const list = [...this.items()];
    list.splice(index, 1);
    this.items.set(list);
  }

  addNewItem(): void {
    const newItem: InwardTableItem = {
      medicineName: '',
      genericName: '',
      mfr: '',
      packaging: "10'S",
      batchNumber: '',
      expiryDate: '2028-06',
      quantity: 1,
      purchasePrice: 0,
      mrp: 0,
      salePrice: 0,
      discount: 0,
      gstRate: 5,
      hsnCode: '30049039',
      category: 'Tablet',
      rackLocation: 'Rack A-01',
      isExisting: false
    };
    this.items.update(list => [...list, newItem]);
  }

  calculateRowTotal(item: InwardTableItem): number {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.purchasePrice) || 0;
    const disc = Number(item.discount) || 0;
    const gst = Number(item.gstRate) || 0;
    const base = qty * rate * (1 - disc / 100);
    return Math.round(base * (1 + gst / 100) * 100) / 100;
  }

  commitToStock(): void {
    if (this.items().length === 0) {
      this.errorMessage.set('No items in the invoice to import.');
      return;
    }

    this.isCommitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      distributorName: this.distributorName(),
      invoiceNumber: this.invoiceNumber(),
      invoiceDate: this.invoiceDate(),
      items: this.items()
    };

    const storeId = this.authService.selectedStore()?.id || this.authService.currentUser()?.storeId || '1';

    this.apiService.commitPurchaseInward(payload, storeId).subscribe({
      next: (res) => {
        this.isCommitting.set(false);
        this.commitResult.set(res);
        this.currentStep.set('SUCCESS');
        this.inventoryService.syncWithBackend(storeId);
        this.stockImported.emit(res);
      },
      error: (err) => {
        this.isCommitting.set(false);
        this.errorMessage.set('Failed to commit inward to stock: ' + (err.error?.message || err.message));
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}
