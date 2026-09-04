package com.medi.app.controller;

import com.medi.app.dto.OrderDtos;
import com.medi.app.entity.StoreOrder;
import com.medi.app.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders & Prescriptions", description = "Doctor e-prescriptions, Customer COD orders, and Store fulfillment")
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @Operation(summary = "Get incoming orders for store or user")
    public ResponseEntity<List<StoreOrder>> getOrders(
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) Long userId) {

        if (storeId != null) {
            return ResponseEntity.ok(orderService.getOrdersByStore(storeId));
        }
        if (userId != null) {
            return ResponseEntity.ok(orderService.getOrdersByUser(userId));
        }
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single order details by ID")
    public ResponseEntity<StoreOrder> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PostMapping("/doctor")
    @Operation(summary = "Doctor submits an e-prescription or drug order to partner store")
    public ResponseEntity<StoreOrder> createDoctorOrder(@RequestBody OrderDtos.CreateDoctorOrderRequest req) {
        StoreOrder order = orderService.createDoctorOrder(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @PostMapping("/customer")
    @Operation(summary = "Customer places an order with Cash on Delivery (COD) or Online Pay")
    public ResponseEntity<StoreOrder> createCustomerOrder(@RequestBody OrderDtos.CreateCustomerOrderRequest req) {
        StoreOrder order = orderService.createCustomerOrder(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Store owner advances order status (PACKED, OUT_FOR_DELIVERY, COMPLETED)")
    public ResponseEntity<StoreOrder> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody OrderDtos.UpdateOrderStatusRequest req) {
        StoreOrder order = orderService.updateOrderStatus(id, req);
        return ResponseEntity.ok(order);
    }
}
