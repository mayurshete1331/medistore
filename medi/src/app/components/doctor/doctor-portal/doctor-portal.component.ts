import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { Medicine } from '../../../core/models/medicine.model';
import { PrescribedOrderItem, OrderPaymentMethod } from '../../../core/models/order.model';

@Component({
  selector: 'app-doctor-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-portal.component.html',
  styleUrls: ['./doctor-portal.component.scss']
})
export class DoctorPortalComponent {
  authService = inject(AuthService);
  orderService = inject(OrderService);
  inventoryService = inject(InventoryService);

  currentUser = this.authService.currentUser;
  partnerStores = this.authService.partnerStores;
  selectedStoreId = signal(this.authService.selectedStore()?.id || (this.partnerStores()[0]?.id || '1'));

  // Selected Store Object
  selectedStore = computed(() => {
    return this.partnerStores().find(s => s.id === this.selectedStoreId()) || this.authService.selectedStore() || this.partnerStores()[0] || null;
  });

  // Mode: DRUG_PICKER or PRESCRIPTION_PAD
  orderMode = signal<'DRUG_PICKER' | 'PRESCRIPTION_PAD'>('DRUG_PICKER');

  // Patient Info Form
  patientName = signal('');
  patientAge = signal<number | null>(null);
  patientGender = signal<'Male' | 'Female' | 'Other'>('Male');
  patientPhone = signal('');
  diagnosis = signal('');
  deliveryAddress = signal('');
  paymentMethod = signal<OrderPaymentMethod>('COD');
  prescriptionNotes = signal('');

  // Search & Drug Selector
  searchQuery = signal('');
  medicines = this.inventoryService.medicines;
  prescribedItems = signal<PrescribedOrderItem[]>([]);

  // Drug builder for current selection
  selectedMedForAdding = signal<Medicine | null>(null);
  currentDosage = signal('1-0-1');
  currentTiming = signal('After Meals');
  currentDurationDays = signal(5);
  currentQty = signal(1);

  // Success Confirmation State
  lastSubmittedOrder = signal<any | null>(null);

  // Doctor's orders
  doctorOrders = computed(() => {
    const docId = this.currentUser()?.id;
    return this.orderService.orders().filter(o => (docId && o.placedBy.userId === docId) || o.placedBy.userRole === 'DOCTOR');
  });

  searchResults = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return [];
    return this.medicines().filter(m => 
      m.brandName.toLowerCase().includes(q) || 
      m.genericName.toLowerCase().includes(q)
    ).slice(0, 6);
  });

  totalPrescriptionCost = computed(() => {
    return this.prescribedItems().reduce((sum, item) => sum + item.total, 0);
  });

  selectMedicineForAdding(med: Medicine): void {
    this.selectedMedForAdding.set(med);
    this.searchQuery.set('');
  }

  addDrugToPrescription(): void {
    const med = this.selectedMedForAdding();
    if (!med) return;

    const unitPrice = med.batches.length > 0 ? med.batches[0].salePrice : 100;
    const qty = Math.max(1, this.currentQty());

    const newItem: PrescribedOrderItem = {
      medicineId: med.id,
      medicineName: med.brandName,
      genericName: med.genericName,
      packaging: med.packaging,
      quantity: qty,
      unitPrice,
      total: +(unitPrice * qty).toFixed(2),
      dosage: this.currentDosage(),
      timing: this.currentTiming(),
      durationDays: this.currentDurationDays()
    };

    this.prescribedItems.set([...this.prescribedItems(), newItem]);
    this.selectedMedForAdding.set(null);
  }

  removePrescribedItem(index: number): void {
    const updated = [...this.prescribedItems()];
    updated.splice(index, 1);
    this.prescribedItems.set(updated);
  }

  submitOrder(): void {
    if (!this.patientName().trim()) {
      alert('Please enter patient name.');
      return;
    }

    if (this.orderMode() === 'DRUG_PICKER' && this.prescribedItems().length === 0) {
      alert('Please add at least one medicine to the prescription.');
      return;
    }

    const store = this.selectedStore();
    const docUser = this.currentUser();
    if (!docUser) {
      alert('Please log in to submit prescriptions.');
      return;
    }

    const order = this.orderService.createDoctorOrder({
      storeId: store.id,
      storeName: store.name,
      doctorUser: docUser,
      patient: {
        patientName: this.patientName().trim(),
        patientAge: this.patientAge() || undefined,
        patientGender: this.patientGender(),
        patientPhone: this.patientPhone().trim() || '+91 98000 00000',
        diagnosis: this.diagnosis().trim()
      },
      items: this.prescribedItems(),
      prescriptionNotes: this.prescriptionNotes().trim(),
      deliveryAddress: this.deliveryAddress().trim() || 'Patient Home Delivery (Address shared on call)',
      paymentMethod: this.paymentMethod()
    });

    this.lastSubmittedOrder.set(order);

    // Reset Form
    this.patientName.set('');
    this.patientAge.set(null);
    this.patientPhone.set('');
    this.diagnosis.set('');
    this.prescribedItems.set([]);
    this.prescriptionNotes.set('');
    this.deliveryAddress.set('');
  }
}
