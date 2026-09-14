import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { Medicine } from '../../../core/models/medicine.model';
import { PrescribedOrderItem, OrderPaymentMethod } from '../../../core/models/order.model';

@Component({
  selector: 'app-customer-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-portal.component.html',
  styleUrls: ['./customer-portal.component.scss']
})
export class CustomerPortalComponent {
  authService = inject(AuthService);
  orderService = inject(OrderService);
  inventoryService = inject(InventoryService);

  currentUser = this.authService.currentUser;
  partnerStores = this.authService.partnerStores;
  selectedStoreId = signal(this.authService.selectedStore()?.id || (this.partnerStores()[0]?.id || '1'));

  selectedStore = computed(() => {
    return this.partnerStores().find(s => s.id === this.selectedStoreId()) || this.authService.selectedStore() || this.partnerStores()[0] || null;
  });

  searchQuery = signal('');
  selectedCategory = signal<string>('ALL');
  activeTab = signal<'CATALOG' | 'ORDERS'>('CATALOG');

  // Customer Cart
  cart = signal<{ medicine: Medicine; quantity: number; unitPrice: number; total: number }[]>([]);

  // Checkout Fields
  familyMemberName = signal('');
  deliveryAddress = signal(this.currentUser()?.customerAddress || '');
  customerPhone = signal(this.currentUser()?.phone || '');
  paymentMethod = signal<OrderPaymentMethod>('COD');
  prescriptionSlip = signal<string | null>(null);

  lastPlacedOrder = signal<any | null>(null);

  categories = ['ALL', 'Tablet', 'Syrup', 'Ointment', 'Drops', 'Surgical & Equipment'];
  medicines = this.inventoryService.medicines;

  // Filtered Catalog
  catalog = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.medicines().filter(m => {
      const matchQ = !q || m.brandName.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q);
      const matchCat = cat === 'ALL' || m.category === cat;
      return matchQ && matchCat;
    });
  });

  cartTotal = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.total, 0);
  });

  cartCount = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.quantity, 0);
  });

  // Customer's previous orders
  myOrders = computed(() => {
    const userId = this.currentUser()?.id;
    return this.orderService.orders().filter(o => (userId && o.placedBy.userId === userId) || o.placedBy.userRole === 'CUSTOMER');
  });

  // Cheaper generic substitute suggestions for items in cart
  genericAlternativesForCart = computed(() => {
    const suggestions: { currentMed: Medicine; suggestedMed: Medicine; savingsPerUnit: number }[] = [];
    const allMeds = this.medicines();

    for (const c of this.cart()) {
      const gen = (c.medicine.genericName || '').trim().toLowerCase();
      if (!gen) continue;

      const alt = allMeds.find(m => {
        if (m.id === c.medicine.id) return false;
        const mGen = (m.genericName || '').trim().toLowerCase();
        if (!mGen || (!mGen.includes(gen) && !gen.includes(mGen))) return false;
        const altPrice = m.batches?.[0]?.salePrice || m.batches?.[0]?.mrp || 0;
        return altPrice > 0 && altPrice < c.unitPrice;
      });

      if (alt) {
        const altPrice = alt.batches?.[0]?.salePrice || alt.batches?.[0]?.mrp || 0;
        suggestions.push({
          currentMed: c.medicine,
          suggestedMed: alt,
          savingsPerUnit: +(c.unitPrice - altPrice).toFixed(2)
        });
      }
    }

    return suggestions;
  });

  addToCart(med: Medicine): void {
    const unitPrice = med.batches.length > 0 ? med.batches[0].salePrice : 100;
    const existing = this.cart().findIndex(c => c.medicine.id === med.id);

    if (existing > -1) {
      const updated = [...this.cart()];
      updated[existing].quantity += 1;
      updated[existing].total = +(updated[existing].quantity * unitPrice).toFixed(2);
      this.cart.set(updated);
    } else {
      this.cart.set([
        ...this.cart(),
        {
          medicine: med,
          quantity: 1,
          unitPrice,
          total: unitPrice
        }
      ]);
    }
  }

  updateQty(medId: string, delta: number): void {
    const updated = this.cart().map(item => {
      if (item.medicine.id !== medId) return item;
      const newQty = item.quantity + delta;
      return {
        ...item,
        quantity: newQty,
        total: +(newQty * item.unitPrice).toFixed(2)
      };
    }).filter(item => item.quantity > 0);

    this.cart.set(updated);
  }

  cartHasScheduleH = computed(() => {
    return this.cart().some(c => c.medicine.isScheduleH || c.medicine.isScheduleH1 || c.medicine.isNarcotic);
  });

  onPrescriptionFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please upload a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.prescriptionSlip.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removePrescriptionSlip(): void {
    this.prescriptionSlip.set(null);
  }

  placeOrder(): void {
    if (this.cart().length === 0) {
      alert('Your cart is empty. Add medicines first.');
      return;
    }

    if (!this.deliveryAddress().trim()) {
      alert('Please enter your delivery address.');
      return;
    }

    // Regulatory compliance check: Schedule H/H1 drugs require uploaded prescription
    if (this.cartHasScheduleH() && !this.prescriptionSlip()) {
      alert('Prescription Slip Required: Your bag contains Schedule H / Antibiotic medicines. Under the Drugs & Cosmetics Act, uploading a photo of a valid doctor\'s prescription is mandatory.');
      return;
    }

    const store = this.selectedStore();
    const custUser = this.currentUser();
    if (!custUser) {
      alert('Please log in to place an order.');
      return;
    }

    const items: PrescribedOrderItem[] = this.cart().map(c => ({
      medicineId: c.medicine.id,
      medicineName: c.medicine.brandName,
      genericName: c.medicine.genericName,
      packaging: c.medicine.packaging,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      total: c.total
    }));

    const order = this.orderService.createCustomerOrder({
      storeId: store.id,
      storeName: store.name,
      customerUser: custUser,
      patient: {
        patientName: this.familyMemberName().trim() || custUser.name,
        familyMemberName: this.familyMemberName().trim() || undefined,
        patientPhone: this.customerPhone().trim()
      },
      items,
      deliveryAddress: this.deliveryAddress().trim(),
      prescriptionPhotoUrl: this.prescriptionSlip() || undefined,
      paymentMethod: this.paymentMethod()
    });

    this.lastPlacedOrder.set(order);
    this.cart.set([]);
    this.familyMemberName.set('');
    this.prescriptionSlip.set(null);
    this.activeTab.set('ORDERS');
  }

  switchCartToGeneric(cartMedId: string, altMed: Medicine): void {
    const existing = this.cart().find(c => c.medicine.id === cartMedId);
    if (!existing) return;
    const qty = existing.quantity;
    this.updateQty(cartMedId, -qty);
    const unitPrice = altMed.batches?.[0]?.salePrice || altMed.batches?.[0]?.mrp || 100;
    this.cart.set([
      ...this.cart(),
      {
        medicine: altMed,
        quantity: qty,
        unitPrice,
        total: +(qty * unitPrice).toFixed(2)
      }
    ]);
  }

  repeatMonthlyRefill(pastOrder: any): void {
    if (!pastOrder || !pastOrder.items || pastOrder.items.length === 0) return;

    const allMeds = this.medicines();
    const newCart: { medicine: Medicine; quantity: number; unitPrice: number; total: number }[] = [];

    for (const item of pastOrder.items) {
      const match = allMeds.find(m => m.id === item.medicineId || m.brandName.toLowerCase() === item.medicineName.toLowerCase());
      if (match) {
        const unitPrice = match.batches?.[0]?.salePrice || match.batches?.[0]?.mrp || item.unitPrice || 100;
        newCart.push({
          medicine: match,
          quantity: item.quantity,
          unitPrice,
          total: +(item.quantity * unitPrice).toFixed(2)
        });
      }
    }

    if (newCart.length > 0) {
      this.cart.set(newCart);
      this.activeTab.set('CATALOG');
      alert(`Loaded ${newCart.length} medicines into your cart for 1-Click Monthly Refill!`);
    } else {
      alert('Could not match items from past order with current catalog.');
    }
  }

  cancelCustomerOrder(order: any): void {
    if (order.orderStatus !== 'NEW_RECEIVED') {
      alert('Orders that are already packed or dispatched cannot be cancelled online. Please call the pharmacy.');
      return;
    }

    if (confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) {
      this.orderService.cancelOrder(order.id, 'Self-service cancellation by customer', this.currentUser()?.name);
    }
  }
}
