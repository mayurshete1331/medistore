package com.medi.app.service;

import com.medi.app.dto.OrderDtos;
import com.medi.app.entity.OrderAuditLog;
import com.medi.app.entity.OrderItem;
import com.medi.app.entity.StoreOrder;
import com.medi.app.entity.User;
import com.medi.app.repository.OrderAuditLogRepository;
import com.medi.app.repository.StoreOrderRepository;
import com.medi.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final StoreOrderRepository storeOrderRepository;
    private final UserRepository userRepository;

    public List<StoreOrder> getAllOrders() {
        return storeOrderRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<StoreOrder> getOrdersByStore(Long storeId) {
        return storeOrderRepository.findByStoreIdOrderByCreatedAtDesc(storeId);
    }

    public List<StoreOrder> getOrdersByUser(Long userId) {
        return storeOrderRepository.findByPlacedByUserIdOrderByCreatedAtDesc(userId);
    }

    public StoreOrder getOrderById(Long id) {
        return storeOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + id));
    }

    @Transactional
    public StoreOrder createDoctorOrder(OrderDtos.CreateDoctorOrderRequest req) {
        LocalDateTime now = LocalDateTime.now();
        String orderNumber = "ORD-DOC-" + String.format("%04d", storeOrderRepository.count() + 1);

        User doctor = userRepository.findById(req.getDoctorUserId())
                .orElseThrow(() -> new RuntimeException("Doctor user not found with ID: " + req.getDoctorUserId()));

        double totalAmount = 0.0;
        List<OrderItem> orderItems = new ArrayList<>();

        if (req.getItems() != null) {
            for (OrderDtos.PrescribedItemDto itemDto : req.getItems()) {
                double lineTotal = itemDto.getTotal() != null ? itemDto.getTotal() : (itemDto.getUnitPrice() * itemDto.getQuantity());
                totalAmount += lineTotal;

                OrderItem item = OrderItem.builder()
                        .medicineId(itemDto.getMedicineId())
                        .medicineName(itemDto.getMedicineName())
                        .genericName(itemDto.getGenericName())
                        .packaging(itemDto.getPackaging())
                        .quantity(itemDto.getQuantity())
                        .unitPrice(itemDto.getUnitPrice())
                        .total(lineTotal)
                        .dosage(itemDto.getDosage())
                        .timing(itemDto.getTiming())
                        .durationDays(itemDto.getDurationDays())
                        .build();

                orderItems.add(item);
            }
        }

        String paymentMethod = req.getPaymentMethod() != null ? req.getPaymentMethod() : "COD";
        String paymentStatus = "ONLINE_PAID".equalsIgnoreCase(paymentMethod) ? "PAID" : "PENDING_COLLECTION";

        StoreOrder order = StoreOrder.builder()
                .orderNumber(orderNumber)
                .orderType("DOCTOR_PRESCRIPTION")
                .storeId(req.getStoreId())
                .storeName(req.getStoreName())
                .placedByUserId(doctor.getId())
                .placedByUserName(doctor.getName())
                .placedByUserRole("DOCTOR")
                .placedByUserPhone(doctor.getPhone())
                .doctorRegNo(doctor.getDoctorRegNo())
                .doctorSpecialty(doctor.getDoctorSpecialty())
                .patientName(req.getPatientName())
                .patientAge(req.getPatientAge())
                .patientGender(req.getPatientGender())
                .patientPhone(req.getPatientPhone())
                .diagnosis(req.getDiagnosis())
                .prescriptionNotes(req.getPrescriptionNotes())
                .deliveryAddress(req.getDeliveryAddress())
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
                .totalAmount(Math.round(totalAmount * 100.0) / 100.0)
                .orderStatus("NEW_RECEIVED")
                .createdAt(now)
                .build();

        for (OrderItem oi : orderItems) {
            oi.setStoreOrder(order);
        }
        order.setItems(orderItems);

        // Audit Trail Entry
        OrderAuditLog auditLog = OrderAuditLog.builder()
                .timestamp(now)
                .action("Prescription Order Dispatched by Doctor")
                .performedBy(doctor.getName() + " (MCI: " + doctor.getDoctorRegNo() + ")")
                .storeOrder(order)
                .build();
        order.getAuditTrail().add(auditLog);

        return storeOrderRepository.save(order);
    }

    @Transactional
    public StoreOrder createCustomerOrder(OrderDtos.CreateCustomerOrderRequest req) {
        LocalDateTime now = LocalDateTime.now();
        String orderNumber = "ORD-CUST-" + String.format("%04d", storeOrderRepository.count() + 1);

        User customer = userRepository.findById(req.getCustomerUserId())
                .orElseThrow(() -> new RuntimeException("Customer user not found with ID: " + req.getCustomerUserId()));

        double totalAmount = 0.0;
        List<OrderItem> orderItems = new ArrayList<>();

        if (req.getItems() != null) {
            for (OrderDtos.PrescribedItemDto itemDto : req.getItems()) {
                double lineTotal = itemDto.getTotal() != null ? itemDto.getTotal() : (itemDto.getUnitPrice() * itemDto.getQuantity());
                totalAmount += lineTotal;

                OrderItem item = OrderItem.builder()
                        .medicineId(itemDto.getMedicineId())
                        .medicineName(itemDto.getMedicineName())
                        .genericName(itemDto.getGenericName())
                        .packaging(itemDto.getPackaging())
                        .quantity(itemDto.getQuantity())
                        .unitPrice(itemDto.getUnitPrice())
                        .total(lineTotal)
                        .build();

                orderItems.add(item);
            }
        }

        String paymentMethod = req.getPaymentMethod() != null ? req.getPaymentMethod() : "COD";
        String paymentStatus = "ONLINE_PAID".equalsIgnoreCase(paymentMethod) ? "PAID" : "PENDING_COLLECTION";

        StoreOrder order = StoreOrder.builder()
                .orderNumber(orderNumber)
                .orderType("CUSTOMER_ORDER")
                .storeId(req.getStoreId())
                .storeName(req.getStoreName())
                .placedByUserId(customer.getId())
                .placedByUserName(customer.getName())
                .placedByUserRole("CUSTOMER")
                .placedByUserPhone(customer.getPhone())
                .patientName(req.getPatientName() != null ? req.getPatientName() : customer.getName())
                .patientPhone(req.getCustomerPhone() != null ? req.getCustomerPhone() : customer.getPhone())
                .deliveryAddress(req.getDeliveryAddress())
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
                .totalAmount(Math.round(totalAmount * 100.0) / 100.0)
                .orderStatus("NEW_RECEIVED")
                .createdAt(now)
                .build();

        for (OrderItem oi : orderItems) {
            oi.setStoreOrder(order);
        }
        order.setItems(orderItems);

        OrderAuditLog auditLog = OrderAuditLog.builder()
                .timestamp(now)
                .action("Customer Order Placed (" + ("COD".equalsIgnoreCase(paymentMethod) ? "Cash on Delivery" : "Prepaid Online") + ")")
                .performedBy(customer.getName())
                .storeOrder(order)
                .build();
        order.getAuditTrail().add(auditLog);

        return storeOrderRepository.save(order);
    }

    @Transactional
    public StoreOrder updateOrderStatus(Long orderId, OrderDtos.UpdateOrderStatusRequest req) {
        StoreOrder order = getOrderById(orderId);
        LocalDateTime now = LocalDateTime.now();

        order.setOrderStatus(req.getNewStatus());

        if ("PACKED".equalsIgnoreCase(req.getNewStatus())) {
            order.setPackedAt(now);
        } else if ("OUT_FOR_DELIVERY".equalsIgnoreCase(req.getNewStatus())) {
            order.setDispatchedAt(now);
        } else if ("COMPLETED".equalsIgnoreCase(req.getNewStatus())) {
            order.setCompletedAt(now);
            if ("COD".equalsIgnoreCase(order.getPaymentMethod())) {
                order.setPaymentStatus("PAID");
            }
        }

        OrderAuditLog auditLog = OrderAuditLog.builder()
                .timestamp(now)
                .action("Order status updated to " + req.getNewStatus() + (req.getNotes() != null ? ": " + req.getNotes() : ""))
                .performedBy(req.getPerformedBy() != null ? req.getPerformedBy() : "Store Pharmacist")
                .notes(req.getNotes())
                .storeOrder(order)
                .build();

        order.getAuditTrail().add(auditLog);

        return storeOrderRepository.save(order);
    }
}
