import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReorderService } from '../../../core/services/reorder.service';
import { AuthService } from '../../../core/services/auth.service';
import { Supplier, ReorderItem } from '../../../core/models/supplier.model';

@Component({
  selector: 'app-reorder-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reorder-dashboard.component.html',
  styleUrls: ['./reorder-dashboard.component.scss']
})
export class ReorderDashboardComponent {
  reorderService = inject(ReorderService);
  authService = inject(AuthService);

  activeReorders = this.reorderService.activeReorders;
  suppliers = this.reorderService.suppliers;
  pendingCount = this.reorderService.pendingApprovalCount;
  approvedCount = this.reorderService.approvedCount;
  totalEstimatedCost = this.reorderService.totalReorderEstimatedCost;

  selectedSupplierForBulk = signal<string>(this.suppliers()[0]?.id || '');
  toastMessage = signal<string | null>(null);

  // Formal Purchase Order (PO) State
  showPoModal = signal<boolean>(false);
  selectedPoSupplierId = signal<string>('');
  currentPoNumber = signal<string>('PO-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000));
  currentPoDate = signal<string>(new Date().toISOString().split('T')[0]);

  storeName = computed(() => this.authService.currentUser()?.storeName || this.authService.selectedStore()?.name || 'MEDICARE PHARMACY & SUPERSTORE');
  storeAddress = computed(() => this.authService.currentUser()?.storeAddress || this.authService.selectedStore()?.address || 'Shop 4 & 5, Health Ave, Medical Sq, Mumbai - 400012');
  storeDlNumber = computed(() => this.authService.currentUser()?.storeDlNumber || this.authService.selectedStore()?.dlNumber || '20B/10928, 21B/10929');
  storeGstin = computed(() => this.authService.currentUser()?.storeGstin || this.authService.selectedStore()?.gstin || '27AABCM1122D1Z9');

  activePoSupplier = computed(() => {
    const id = this.selectedPoSupplierId();
    return this.suppliers().find(s => s.id === id) || this.suppliers()[0] || null;
  });

  poItems = computed(() => {
    const supId = this.activePoSupplier()?.id;
    if (!supId) return [];
    return this.activeReorders().filter(r => r.supplierId === supId);
  });

  poTotal = computed(() => {
    return this.poItems().reduce((acc, item) => acc + (item.customQty * item.estimatedUnitPrice), 0);
  });

  openPoModal(supId?: string): void {
    const targetId = supId || this.selectedSupplierForBulk() || this.suppliers()[0]?.id || '';
    this.selectedPoSupplierId.set(targetId);
    this.currentPoNumber.set('PO-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000));
    this.showPoModal.set(true);
  }

  closePoModal(): void {
    this.showPoModal.set(false);
  }

  printPo(): void {
    window.print();
  }

  showSupplierModal = signal<boolean>(false);
  isEditingSupplier = signal<boolean>(false);
  supplierForm = {
    id: '',
    name: '',
    contactPerson: '',
    whatsappNumber: '',
    email: '',
    phone: '',
    gstin: '',
    drugLicenseNo: '',
    address: ''
  };

  openSupplierModal(): void {
    this.startNewSupplier();
    this.showSupplierModal.set(true);
  }

  closeSupplierModal(): void {
    this.showSupplierModal.set(false);
  }

  startNewSupplier(): void {
    this.isEditingSupplier.set(false);
    this.supplierForm = {
      id: '',
      name: '',
      contactPerson: '',
      whatsappNumber: '',
      email: '',
      phone: '',
      gstin: '',
      drugLicenseNo: '',
      address: ''
    };
  }

  editSupplier(sup: Supplier): void {
    this.isEditingSupplier.set(true);
    this.supplierForm = {
      id: sup.id,
      name: sup.name,
      contactPerson: sup.contactPerson,
      whatsappNumber: sup.whatsappNumber || sup.phone,
      email: sup.email,
      phone: sup.phone,
      gstin: sup.gstin || '',
      drugLicenseNo: sup.drugLicenseNo || '',
      address: sup.address || ''
    };
  }

  saveSupplier(): void {
    if (!this.supplierForm.name.trim()) {
      alert('Distributor / Agency Name is required!');
      return;
    }
    if (!this.supplierForm.whatsappNumber.trim() && !this.supplierForm.email.trim()) {
      alert('Please provide at least a WhatsApp Number or Email ID!');
      return;
    }

    if (this.isEditingSupplier() && this.supplierForm.id) {
      this.reorderService.updateSupplierDetails(this.supplierForm.id, {
        name: this.supplierForm.name.trim(),
        contactPerson: this.supplierForm.contactPerson.trim(),
        whatsappNumber: this.supplierForm.whatsappNumber.trim(),
        phone: this.supplierForm.whatsappNumber.trim(),
        email: this.supplierForm.email.trim(),
        gstin: this.supplierForm.gstin.trim(),
        drugLicenseNo: this.supplierForm.drugLicenseNo.trim(),
        address: this.supplierForm.address.trim()
      });
      this.showToast(`✓ Updated dealer '${this.supplierForm.name}'!`);
    } else {
      this.reorderService.addSupplier({
        name: this.supplierForm.name.trim(),
        contactPerson: this.supplierForm.contactPerson.trim(),
        whatsappNumber: this.supplierForm.whatsappNumber.trim(),
        phone: this.supplierForm.whatsappNumber.trim(),
        email: this.supplierForm.email.trim(),
        gstin: this.supplierForm.gstin.trim(),
        drugLicenseNo: this.supplierForm.drugLicenseNo.trim(),
        address: this.supplierForm.address.trim()
      });
      this.showToast(`✓ Added new dealer '${this.supplierForm.name}'!`);
    }

    this.startNewSupplier();
  }

  deleteSupplier(id: string): void {
    if (confirm('Are you sure you want to remove this dealer?')) {
      this.reorderService.deleteSupplier(id);
      this.showToast('✓ Dealer removed successfully');
      if (this.supplierForm.id === id) {
        this.startNewSupplier();
      }
    }
  }

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
