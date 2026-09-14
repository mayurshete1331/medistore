import { Injectable, signal, computed, inject } from '@angular/core';
import { StoreOrder, PrescribedOrderItem, OrderPatientInfo, OrderStatus, OrderPaymentMethod } from '../models/order.model';
import { User } from '../models/auth.model';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

export const INITIAL_ORDERS: StoreOrder[] = [];

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly ORDERS_STORAGE_KEY = 'medi_store_orders_v1';
  private authService = inject(AuthService);
  private api = inject(ApiService);

  readonly orders = signal<StoreOrder[]>(this.loadOrders());

  constructor() {
    this.syncOrdersFromBackend();
  }

  syncOrdersFromBackend(): void {
    this.api.getOrders().subscribe({
      next: (backendOrders) => {
        if (backendOrders && backendOrders.length > 0) {
          const mapped: StoreOrder[] = backendOrders.map((o: any) => ({
            id: String(o.id || o.orderNumber),
            orderNumber: o.orderNumber,
            orderType: o.orderType,
            storeId: String(o.storeId || 'store-1'),
            storeName: o.storeName || 'MediCare Pharmacy',
            placedBy: {
              userId: String(o.userId || ''),
              userName: o.userName || '',
              userRole: o.userRole || 'CUSTOMER',
              userPhone: o.userPhone || '',
              doctorRegNo: o.doctorRegNo,
              doctorSpecialty: o.doctorSpecialty
            },
            patient: {
              patientName: o.patientName,
              patientAge: o.patientAge,
              patientGender: o.patientGender,
              patientPhone: o.patientPhone,
              diagnosis: o.diagnosis,
              vitalsBp: o.patientVitalsBp,
              vitalsPulse: o.patientVitalsPulse,
              vitalsWeight: o.patientVitalsWeight,
              vitalsTemp: o.patientVitalsTemp,
              vitalsSpo2: o.patientVitalsSpo2,
              familyMemberName: o.familyMemberName
            },
            familyMemberName: o.familyMemberName,
            patientVitalsBp: o.patientVitalsBp,
            patientVitalsPulse: o.patientVitalsPulse,
            patientVitalsWeight: o.patientVitalsWeight,
            patientVitalsTemp: o.patientVitalsTemp,
            patientVitalsSpo2: o.patientVitalsSpo2,
            items: (o.items || []).map((i: any) => ({
              medicineId: String(i.medicineId),
              medicineName: i.medicineName,
              genericName: i.genericName,
              packaging: i.packaging,
              quantity: Number(i.quantity),
              unitPrice: Number(i.unitPrice),
              total: Number(i.total),
              dosage: i.dosage,
              timing: i.timing,
              durationDays: i.durationDays
            })),
            prescriptionNotes: o.prescriptionNotes,
            deliveryAddress: o.deliveryAddress,
            prescriptionPhotoUrl: o.prescriptionPhotoUrl,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            orderStatus: o.orderStatus,
            totalAmount: Number(o.totalAmount),
            createdAt: o.createdAt || new Date().toISOString(),
            packedAt: o.packedAt,
            dispatchedAt: o.dispatchedAt,
            completedAt: o.completedAt,
            auditTrail: (o.auditTrail || []).map((a: any) => ({
              timestamp: a.timestamp,
              action: a.action,
              performedBy: a.performedBy
            }))
          }));
          this.orders.set(mapped);
          this.saveOrders(mapped);
        }
      },
      error: () => {}
    });
  }

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
    return [];
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

    // Sync doctor order to Spring Boot backend
    const storeNum = parseInt(data.storeId.replace(/\D/g, ''), 10) || 1;
    const docUserIdNum = parseInt(data.doctorUser.id.replace(/\D/g, ''), 10) || 2;
    this.api.createDoctorOrder({
      storeId: storeNum,
      storeName: data.storeName,
      doctorUserId: docUserIdNum,
      doctorName: data.doctorUser.name,
      doctorRegNo: data.doctorUser.doctorRegNo || '',
      doctorSpecialty: data.doctorUser.doctorSpecialty || '',
      doctorPhone: data.doctorUser.phone || '',
      patientName: data.patient.patientName,
      patientAge: data.patient.patientAge,
      patientGender: data.patient.patientGender,
      patientPhone: data.patient.patientPhone,
      diagnosis: data.patient.diagnosis,
      patientVitalsBp: data.patient.vitalsBp || '',
      patientVitalsPulse: data.patient.vitalsPulse || '',
      patientVitalsWeight: data.patient.vitalsWeight || '',
      patientVitalsTemp: data.patient.vitalsTemp || '',
      patientVitalsSpo2: data.patient.vitalsSpo2 || '',
      prescriptionNotes: data.prescriptionNotes,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.paymentMethod,
      items: data.items.map(i => ({
        medicineId: parseInt(i.medicineId.replace(/\D/g, ''), 10) || 1,
        medicineName: i.medicineName,
        genericName: i.genericName,
        packaging: i.packaging,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        dosage: i.dosage,
        timing: i.timing,
        durationDays: i.durationDays
      }))
    }).subscribe({
      next: (res) => {
        if (res?.orderNumber) {
          console.log('Doctor prescription registered in Spring Boot MySQL:', res.orderNumber);
        }
      },
      error: () => {}
    });

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
    prescriptionPhotoUrl?: string;
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
      prescriptionPhotoUrl: data.prescriptionPhotoUrl,
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

    // Sync customer order to Spring Boot backend
    const storeNum = parseInt(data.storeId.replace(/\D/g, ''), 10) || 1;
    const custUserIdNum = parseInt(data.customerUser.id.replace(/\D/g, ''), 10) || 3;
    this.api.createCustomerOrder({
      storeId: storeNum,
      storeName: data.storeName,
      customerUserId: custUserIdNum,
      customerName: data.customerUser.name,
      customerPhone: data.customerUser.phone || '',
      patientName: data.patient.patientName,
      familyMemberName: data.patient.familyMemberName || '',
      patientAge: data.patient.patientAge,
      patientGender: data.patient.patientGender,
      patientPhone: data.patient.patientPhone,
      diagnosis: data.patient.diagnosis,
      deliveryAddress: data.deliveryAddress,
      prescriptionPhotoUrl: data.prescriptionPhotoUrl,
      paymentMethod: data.paymentMethod,
      items: data.items.map(i => ({
        medicineId: parseInt(i.medicineId.replace(/\D/g, ''), 10) || 1,
        medicineName: i.medicineName,
        genericName: i.genericName,
        packaging: i.packaging,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        dosage: i.dosage,
        timing: i.timing,
        durationDays: i.durationDays
      }))
    }).subscribe({
      next: (res) => {
        if (res?.orderNumber) {
          console.log('Customer order registered in Spring Boot MySQL:', res.orderNumber);
        }
      },
      error: () => {}
    });

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

    // Sync status change with Spring Boot backend
    const numId = parseInt(orderId.replace(/\D/g, ''), 10);
    if (numId) {
      this.api.updateOrderStatus(numId, {
        newStatus,
        performedByName,
        notes: note || ''
      }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
  }

  cancelOrder(orderId: string, reason?: string, cancelledBy?: string): void {
    this.updateOrderStatus(
      orderId,
      'CANCELLED',
      cancelledBy || 'Customer Self-Service',
      reason || 'Order cancelled by customer before dispatch'
    );
  }
}
