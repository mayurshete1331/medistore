import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { Medicine, MedicineCategory } from '../../../core/models/medicine.model';
import { AddMedicineModalComponent } from '../add-medicine-modal/add-medicine-modal.component';
import { PurchaseInwardModalComponent } from '../purchase-inward-modal/purchase-inward-modal.component';

@Component({
  selector: 'app-medicine-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AddMedicineModalComponent, PurchaseInwardModalComponent],
  templateUrl: './medicine-list.component.html',
  styleUrls: ['./medicine-list.component.scss']
})
export class MedicineListComponent {
  inventoryService = inject(InventoryService);

  searchQuery = signal('');
  selectedCategory = signal<string>('ALL');
  stockFilter = signal<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'EXPIRING'>('ALL');
  showAddModal = signal(false);
  showInwardModal = signal(false);
  inwardToastMessage = signal<string | null>(null);
  expandedMedId = signal<string | null>(null);

  // Quick Restock state
  restockingMedId = signal<string | null>(null);
  restockQuantity = signal<number>(10);

  categories = ['ALL', ...this.inventoryService.categories];
  medicines = this.inventoryService.medicines;
  lowStockList = this.inventoryService.lowStockMedicines;
  expiringBatches = this.inventoryService.expiringSoonBatches;
  totalValuation = this.inventoryService.totalValuation;

  filteredMedicines = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const filter = this.stockFilter();

    return this.medicines().filter(med => {
      // Search match
      const matchSearch = !query || 
        med.brandName.toLowerCase().includes(query) ||
        med.genericName.toLowerCase().includes(query) ||
        med.manufacturer.toLowerCase().includes(query) ||
        med.rackLocation.toLowerCase().includes(query);

      // Category match
      const matchCat = cat === 'ALL' || med.category === cat;

      // Stock status filter
      let matchStock = true;
      if (filter === 'IN_STOCK') {
        matchStock = med.totalStockPacks > med.reorderLevel;
      } else if (filter === 'LOW_STOCK') {
        matchStock = med.totalStockPacks <= med.reorderLevel;
      } else if (filter === 'EXPIRING') {
        const expiringMedIds = new Set(this.expiringBatches().map(e => e.medicine.id));
        matchStock = expiringMedIds.has(med.id);
      }

      return matchSearch && matchCat && matchStock;
    });
  });

  toggleExpand(medId: string): void {
    if (this.expandedMedId() === medId) {
      this.expandedMedId.set(null);
    } else {
      this.expandedMedId.set(medId);
    }
  }

  openRestock(medId: string, event: Event): void {
    event.stopPropagation();
    this.restockingMedId.set(medId);
    this.restockQuantity.set(20);
  }

  confirmRestock(medId: string): void {
    if (this.restockQuantity() > 0) {
      this.inventoryService.restockMedicine(medId, this.restockQuantity());
      this.restockingMedId.set(null);
    }
  }

  cancelRestock(): void {
    this.restockingMedId.set(null);
  }

  isExpiring(batchExpiry: string): boolean {
    const today = new Date();
    const exp = new Date(batchExpiry + '-01');
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 180; // less than 6 months
  }

  onStockImported(result: any): void {
    const packs = result?.totalPacksAdded || 0;
    const items = result?.itemsImported || 0;
    this.inwardToastMessage.set(`✓ Purchase Inward Success: ${packs} packs added across ${items} medicines!`);
    setTimeout(() => {
      this.inwardToastMessage.set(null);
    }, 6000);
  }
}
