import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReorderService } from '../../../core/services/reorder.service';
import { ReorderItem } from '../../../core/models/supplier.model';

@Component({
  selector: 'app-reorder-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reorder-dashboard.component.html',
  styleUrls: ['./reorder-dashboard.component.scss']
})
export class ReorderDashboardComponent {
  reorderService = inject(ReorderService);

  activeReorders = this.reorderService.activeReorders;
  suppliers = this.reorderService.suppliers;
  pendingCount = this.reorderService.pendingApprovalCount;
  approvedCount = this.reorderService.approvedCount;
  totalEstimatedCost = this.reorderService.totalReorderEstimatedCost;

  selectedSupplierForBulk = signal<string>(this.suppliers()[0]?.id || '');
  toastMessage = signal<string | null>(null);

  updateQty(medId: string, qty: number): void {
    this.reorderService.updateCustomQuantity(medId, qty);
  }

  updateSupplier(medId: string, supId: string): void {
    this.reorderService.updateSupplier(medId, supId);
  }

  updateNotes(medId: string, notes: string): void {
    this.reorderService.updateNotes(medId, notes);
  }

  approveItem(medId: string): void {
    this.reorderService.approveSingleReorder(medId);
    this.showToast('✓ Order authorized by Owner!');
  }

  revokeItem(medId: string): void {
    this.reorderService.revokeApproval(medId);
  }

  approveAll(): void {
    this.reorderService.approveAllReorders();
    this.showToast('✓ All pending stock orders approved by Owner!');
  }

  dispatchWhatsApp(item: ReorderItem): void {
    const url = this.reorderService.generateWhatsAppUrl(item);
    window.open(url, '_blank');
    this.showToast(`📱 Opening WhatsApp chat for ${item.medicineName}...`);
  }

  dispatchEmail(item: ReorderItem): void {
    const url = this.reorderService.generateEmailUrl(item);
    window.location.href = url;
    this.showToast(`✉️ Opening mail client for ${item.medicineName}...`);
  }

  dispatchBulkWhatsApp(): void {
    const supId = this.selectedSupplierForBulk();
    const approvedForSupplier = this.activeReorders().filter(r => r.supplierId === supId && r.status === 'APPROVED');
    
    if (approvedForSupplier.length === 0) {
      alert('Please approve at least one order for the selected supplier first!');
      return;
    }

    const url = this.reorderService.generateBulkWhatsAppUrl(supId);
    window.open(url, '_blank');
    this.showToast(`📱 Opening Bulk WhatsApp Order for ${approvedForSupplier.length} items...`);
  }

  markReceived(item: ReorderItem): void {
    this.reorderService.markAsReceived(item.medicineId, item.customQty);
    this.showToast(`✓ Received and restocked ${item.customQty} packs of ${item.medicineName}!`);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}
