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

  // Clinical Vitals Form (NMC Compliant)
  patientVitalsBp = signal('');
  patientVitalsPulse = signal('');
  patientVitalsWeight = signal('');
  patientVitalsTemp = signal('');
  patientVitalsSpo2 = signal('');

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

  // Check recurring patient by phone for 1-Click Repeat
  matchingPreviousRx = computed(() => {
    const phone = this.patientPhone().replace(/\D/g, '');
    if (phone.length < 10) return null;
    const past = this.doctorOrders().filter(o => (o.patient?.patientPhone || '').replace(/\D/g, '') === phone);
    return past.length > 0 ? past[0] : null;
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

  dosagePresets = ['1-0-1', '1-0-0', '0-0-1', '0-1-0', '1-1-1', 'SOS', '5 ml TDS', '5 ml BD', '10 ml BD', '2.5 ml BD'];

  // Custom Unstocked Drug Prescribing
  showCustomDrugModal = signal(false);
  customDrug = {
    brandName: '',
    genericName: '',
    packaging: '10 Tablets/Strip',
    dosage: '1-0-1',
    timing: 'After Meals',
    durationDays: 5,
    quantity: 1,
    unitPrice: 50
  };

  // NMC e-Prescription Print State & Letterhead Suppression
  showPrintRxModal = signal(false);
  selectedOrderForPrint = signal<any | null>(null);
  suppressClinicLetterhead = signal(false);

  selectMedicineForAdding(med: Medicine): void {
    this.selectedMedForAdding.set(med);
    this.searchQuery.set('');
    this.recalcDosageQuantity();
  }

  setDosagePreset(preset: string): void {
    this.currentDosage.set(preset);
    this.recalcDosageQuantity();
  }

  setDurationPreset(days: number): void {
    this.currentDurationDays.set(days);
    this.recalcDosageQuantity();
  }

  recalcDosageQuantity(): void {
    const dosage = this.currentDosage();
    const days = this.currentDurationDays();
    let perDay = 1;
    if (dosage === '1-0-1') perDay = 2;
    else if (dosage === '1-1-1') perDay = 3;
    else if (dosage === '1-1-1-1') perDay = 4;
    else if (dosage === '1-0-0' || dosage === '0-0-1' || dosage === '0-1-0') perDay = 1;
    else if (dosage === 'SOS') perDay = 1;

    const med = this.selectedMedForAdding();
    const upp = med?.unitsPerPack || 10;
    const totalTabs = perDay * days;
    const packs = Math.max(1, Math.ceil(totalTabs / upp));
    this.currentQty.set(packs);
  }

  openCustomDrugModal(): void {
    this.customDrug = {
      brandName: this.searchQuery().trim(),
      genericName: '',
      packaging: '10 Tablets/Strip',
      dosage: '1-0-1',
      timing: 'After Meals',
      durationDays: 5,
      quantity: 1,
      unitPrice: 50
    };
    this.showCustomDrugModal.set(true);
  }

  addCustomDrugToPrescription(): void {
    if (!this.customDrug.brandName.trim()) {
      alert('Please enter medicine name');
      return;
    }

    const newItem: PrescribedOrderItem = {
      medicineId: 'custom-' + Date.now(),
      medicineName: this.customDrug.brandName.trim(),
      genericName: this.customDrug.genericName.trim() || 'Custom Formulation',
      packaging: this.customDrug.packaging.trim() || '10 Tablets/Strip',
      quantity: Math.max(1, this.customDrug.quantity),
      unitPrice: this.customDrug.unitPrice || 50,
      total: +((this.customDrug.unitPrice || 50) * Math.max(1, this.customDrug.quantity)).toFixed(2),
      dosage: this.customDrug.dosage,
      timing: this.customDrug.timing,
      durationDays: this.customDrug.durationDays
    };

    this.prescribedItems.set([...this.prescribedItems(), newItem]);
    this.showCustomDrugModal.set(false);
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

  openPrintRxModal(order?: any): void {
    if (order) {
      this.selectedOrderForPrint.set(order);
    } else {
      if (this.prescribedItems().length === 0 && !this.prescriptionNotes().trim()) {
        alert('Prescription is empty. Please add medicines or notes first.');
        return;
      }
      this.selectedOrderForPrint.set({
        orderNumber: 'DRAFT-RX-' + Date.now().toString().slice(-4),
        createdAt: new Date().toISOString(),
        patient: {
          patientName: this.patientName() || 'Valued Patient',
          patientAge: this.patientAge(),
          patientGender: this.patientGender(),
          patientPhone: this.patientPhone() || '+91 98000 00000',
          diagnosis: this.diagnosis() || 'Clinical Examination',
          vitalsBp: this.patientVitalsBp(),
          vitalsPulse: this.patientVitalsPulse(),
          vitalsWeight: this.patientVitalsWeight(),
          vitalsTemp: this.patientVitalsTemp(),
          vitalsSpo2: this.patientVitalsSpo2()
        },
        items: this.prescribedItems(),
        prescriptionNotes: this.prescriptionNotes()
      });
    }
    this.showPrintRxModal.set(true);
  }

  repeatPreviousRx(pastOrder: any): void {
    if (!pastOrder) return;
    this.patientName.set(pastOrder.patient?.patientName || '');
    this.patientAge.set(pastOrder.patient?.patientAge || null);
    this.patientGender.set(pastOrder.patient?.patientGender || 'Male');
    this.diagnosis.set(pastOrder.patient?.diagnosis || '');
    this.patientVitalsBp.set(pastOrder.patient?.vitalsBp || pastOrder.patientVitalsBp || '');
    this.patientVitalsPulse.set(pastOrder.patient?.vitalsPulse || pastOrder.patientVitalsPulse || '');
    this.patientVitalsWeight.set(pastOrder.patient?.vitalsWeight || pastOrder.patientVitalsWeight || '');
    this.patientVitalsTemp.set(pastOrder.patient?.vitalsTemp || pastOrder.patientVitalsTemp || '');
    this.patientVitalsSpo2.set(pastOrder.patient?.vitalsSpo2 || pastOrder.patientVitalsSpo2 || '');
    this.prescribedItems.set([...(pastOrder.items || [])]);
  }

  printRx(): void {
    window.print();
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
        diagnosis: this.diagnosis().trim(),
        vitalsBp: this.patientVitalsBp().trim(),
        vitalsPulse: this.patientVitalsPulse().trim(),
        vitalsWeight: this.patientVitalsWeight().trim(),
        vitalsTemp: this.patientVitalsTemp().trim(),
        vitalsSpo2: this.patientVitalsSpo2().trim()
      },
      items: this.prescribedItems(),
      prescriptionNotes: this.prescriptionNotes().trim(),
      deliveryAddress: 'Clinic OPD / Counter Dispense',
      paymentMethod: 'COD'
    });

    this.lastSubmittedOrder.set(order);

    // Reset Form
    this.patientName.set('');
    this.patientAge.set(null);
    this.patientPhone.set('');
    this.diagnosis.set('');
    this.patientVitalsBp.set('');
    this.patientVitalsPulse.set('');
    this.patientVitalsWeight.set('');
    this.patientVitalsTemp.set('');
    this.patientVitalsSpo2.set('');
    this.prescribedItems.set([]);
    this.prescriptionNotes.set('');
    this.deliveryAddress.set('');
  }
}
