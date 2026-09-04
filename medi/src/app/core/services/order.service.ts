import { Injectable, signal, computed, inject } from '@angular/core';
import { StoreOrder, PrescribedOrderItem, OrderPatientInfo, OrderStatus, OrderPaymentMethod } from '../models/order.model';
import { User } from '../models/auth.model';
import { AuthService } from './auth.service';

export const INITIAL_ORDERS: StoreOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-2025-0101',
    orderType: 'DOCTOR_PRESCRIPTION',
    storeId: 'store-1',
    storeName: 'MediCare Pharmacy & SuperStore (Main Branch)',
    placedBy: {
      userId: 'user-doctor',
      userName: 'Dr. Sneha Roy, MBBS, MD',
      userRole: 'DOCTOR',
      userPhone: '+91 98201 88990',
      doctorRegNo: 'MMC-2016-89421',
      doctorSpecialty: 'Internal Medicine & Chronic Care'
    },
    patient: {
      patientName: 'Rameshwar Sharma',
      patientAge: 54,
      patientGender: 'Male',
      patientPhone: '+91 98334 11223',
      diagnosis: 'Type 2 Diabetes Mellitus with Essential Hypertension'
    },
    items: [
      {
        medicineId: 'med-5',
        medicineName: 'Telma 40',
        genericName: 'Telmisartan (40mg)',
        packaging: '15 Tablets/Strip',
        quantity: 2,
        unitPrice: 210.00,
        total: 420.00,
        dosage: '1-0-0',
        timing: 'Morning after breakfast',
        durationDays: 30
      },
      {
        medicineId: 'med-6',
        medicineName: 'Glycomet-GP 2',
        genericName: 'Glimepiride (2mg) + Metformin (500mg)',
        packaging: '15 Tablets/Strip',
        quantity: 2,
        unitPrice: 225.00,
        total: 450.00,
        dosage: '1-0-1',
        timing: 'Before meals with water',
        durationDays: 30
      }
    ],
    prescriptionNotes: 'Patient advised low sodium diet, avoid sugar. Review HbA1c in 3 months. Dispense exact salts or approved high-grade generics.',
    deliveryAddress: 'Home Delivery to Patient: 102/B, Sai Krupa CHS, Tilak Nagar, Mumbai',
    paymentMethod: 'COD',
    paymentStatus: 'PENDING_COLLECTION',
    orderStatus: 'NEW_RECEIVED',
    totalAmount: 870.00,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    auditTrail: [
      {
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        action: 'Prescription Order Placed by Doctor',
        performedBy: 'Dr. Sneha Roy (Reg: MMC-2016-89421)'
      }
    ]
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-2025-0102',
    orderType: 'CUSTOMER_ORDER',
    storeId: 'store-1',
    storeName: 'MediCare Pharmacy & SuperStore (Main Branch)',
    placedBy: {
      userId: 'user-customer',
      userName: 'Vikram Malhotra',
      userRole: 'CUSTOMER',
      userPhone: '+91 98199 44332'
    },
    patient: {
      patientName: 'Vikram Malhotra',
      patientAge: 38,
      patientGender: 'Male',
      patientPhone: '+91 98199 44332',
      diagnosis: 'Acute Fever & Viral Cold'
    },
    items: [
      {
        medicineId: 'med-2',
        medicineName: 'Dolo 650',
        genericName: 'Paracetamol (650mg)',
        packaging: '15 Tablets/Strip',
        quantity: 2,
        unitPrice: 32.00,
        total: 64.00,
        dosage: 'SOS (as needed)',
        timing: 'After meals'
      },
      {
        medicineId: 'med-7',
        medicineName: 'Ascoril D Plus Syrup',
        genericName: 'Dextromethorphan + Phenylephrine',
        packaging: '100ml Bottle',
        quantity: 1,
        unitPrice: 130.00,
        total: 130.00,
        dosage: '10ml TDS',
        timing: 'After food'
      }
    ],
    deliveryAddress: 'Flat 402, Green Meadows Tower, Link Road, Andheri West, Mumbai 400053',
    paymentMethod: 'ONLINE_PAID',
    paymentStatus: 'PAID',
    orderStatus: 'PACKED',
    totalAmount: 194.00,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    packedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    auditTrail: [
      {
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        action: 'Direct Order Placed by Customer (Prepaid UPI)',
        performedBy: 'Vikram Malhotra'
      },
      {
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        action: 'Order Accepted & Packed with Verified Batches',
        performedBy: 'Store Pharmacist (Rajesh Patel)'
      }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly ORDERS_STORAGE_KEY = 'medi_store_orders_v1';
  private authService = inject(AuthService);

  readonly orders = signal<StoreOrder[]>(this.loadOrders());

  // Computeds for Store Owner
  readonly pendingOrders = computed(() => {
    return this.orders().filter(o => o.orderStatus === 'NEW_RECEIVED');
  });

  readonly packedOrders = computed(() => {
    return this.orders().filter(o => o.orderStatus === 'PACKED');
  });

  readonly codOrders = computed(() => {
    return this.orders().filter(o => o.paymentMethod === 'COD');
  });

  readonly doctorOrders = computed(() => {
    return this.orders().filter(o => o.orderType === 'DOCTOR_PRESCRIPTION' || o.orderType === 'DOCTOR_DRUG_ORDER');
  });

  private loadOrders(): StoreOrder[] {
    try {
      const saved = localStorage.getItem(this.ORDERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load orders from storage', e);
    }
    return INITIAL_ORDERS;
  }

  private saveOrders(orders: StoreOrder[]): void {
    this.orders.set(orders);
    try {
      localStorage.setItem(this.ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to storage', e);
    }
  }

  // 1. Doctor Prescription & Drug Order Creation
  createDoctorOrder(data: {
    storeId: string;
    storeName: string;
    doctorUser: User;
    patient: OrderPatientInfo;
    items: PrescribedOrderItem[];
    prescriptionNotes?: string;
    deliveryAddress?: string;
    paymentMethod: OrderPaymentMethod;
  }): StoreOrder {
    const totalAmount = data.items.reduce((sum, i) => sum + i.total, 0);
    const now = new Date();
    const orderNumber = 'ORD-DOC-' + String(this.orders().length + 1).padStart(4, '0');

    const newOrder: StoreOrder = {
      id: 'ord-' + Date.now(),
      orderNumber,
      orderType: 'DOCTOR_PRESCRIPTION',
      storeId: data.storeId,
      storeName: data.storeName,
      placedBy: {
        userId: data.doctorUser.id,
        userName: data.doctorUser.name,
        userRole: 'DOCTOR',
        userPhone: data.doctorUser.phone,
        doctorRegNo: data.doctorUser.doctorRegNo,
        doctorSpecialty: data.doctorUser.doctorSpecialty
      },
      patient: data.patient,
      items: data.items,
      prescriptionNotes: data.prescriptionNotes,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === 'ONLINE_PAID' ? 'PAID' : 'PENDING_COLLECTION',
      orderStatus: 'NEW_RECEIVED',
      totalAmount,
      createdAt: now.toISOString(),
      auditTrail: [
        {
          timestamp: now.toISOString(),
          action: 'Prescription Order Placed by Doctor',
          performedBy: `${data.doctorUser.name} (Reg: ${data.doctorUser.doctorRegNo})`
        }
      ]
    };

    const updated = [newOrder, ...this.orders()];
    this.saveOrders(updated);
    return newOrder;
  }

  // 2. Customer Direct Order Creation
  createCustomerOrder(data: {
    storeId: string;
    storeName: string;
    customerUser: User;
    patient: OrderPatientInfo;
    items: PrescribedOrderItem[];
    deliveryAddress: string;
    paymentMethod: OrderPaymentMethod;
  }): StoreOrder {
    const totalAmount = data.items.reduce((sum, i) => sum + i.total, 0);
    const now = new Date();
    const orderNumber = 'ORD-CUST-' + String(this.orders().length + 1).padStart(4, '0');

    const newOrder: StoreOrder = {
      id: 'ord-' + Date.now(),
      orderNumber,
      orderType: 'CUSTOMER_ORDER',
      storeId: data.storeId,
      storeName: data.storeName,
      placedBy: {
        userId: data.customerUser.id,
        userName: data.customerUser.name,
        userRole: 'CUSTOMER',
        userPhone: data.customerUser.phone
      },
      patient: data.patient,
      items: data.items,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === 'ONLINE_PAID' ? 'PAID' : 'PENDING_COLLECTION',
      orderStatus: 'NEW_RECEIVED',
      totalAmount,
      createdAt: now.toISOString(),
      auditTrail: [
        {
          timestamp: now.toISOString(),
          action: `Customer Order Placed (${data.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid Online'})`,
          performedBy: data.customerUser.name
        }
      ]
    };

    const updated = [newOrder, ...this.orders()];
    this.saveOrders(updated);
    return newOrder;
  }

  // 3. Store Owner Order Lifecycle Management
  updateOrderStatus(orderId: string, newStatus: OrderStatus, performedByName: string, note?: string): void {
    const now = new Date().toISOString();
    const updated = this.orders().map(order => {
      if (order.id !== orderId) return order;

      const auditTrail = [
        ...order.auditTrail,
        {
          timestamp: now,
          action: `Status changed to ${newStatus}${note ? ': ' + note : ''}`,
          performedBy: performedByName
        }
      ];

      const patch: Partial<StoreOrder> = {
        orderStatus: newStatus,
        auditTrail
      };

      if (newStatus === 'PACKED') patch.packedAt = now;
      if (newStatus === 'OUT_FOR_DELIVERY') patch.dispatchedAt = now;
      if (newStatus === 'COMPLETED') {
        patch.completedAt = now;
        if (order.paymentMethod === 'COD') patch.paymentStatus = 'PAID';
      }

      return {
        ...order,
        ...patch
      };
    });

    this.saveOrders(updated);
  }
}
