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

  // Customer Cart
  cart = signal<{ medicine: Medicine; quantity: number; unitPrice: number; total: number }[]>([]);

  // Checkout Fields
  deliveryAddress = signal(this.currentUser().customerAddress || '');
  customerPhone = signal(this.currentUser().phone || '');
  paymentMethod = signal<OrderPaymentMethod>('COD');

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
    const userId = this.currentUser().id;
    return this.orderService.orders().filter(o => o.placedBy.userId === userId || o.placedBy.userRole === 'CUSTOMER');
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

  placeOrder(): void {
    if (this.cart().length === 0) {
      alert('Your cart is empty. Add medicines first.');
      return;
    }

    if (!this.deliveryAddress().trim()) {
      alert('Please enter your delivery address.');
      return;
    }

    const store = this.selectedStore();
    const custUser = this.currentUser();

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
        patientName: custUser.name,
        patientPhone: this.customerPhone().trim()
      },
      items,
      deliveryAddress: this.deliveryAddress().trim(),
      paymentMethod: this.paymentMethod()
    });

    this.lastPlacedOrder.set(order);
    this.cart.set([]);
  }
}
