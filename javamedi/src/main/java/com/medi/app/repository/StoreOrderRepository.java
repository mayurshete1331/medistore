package com.medi.app.repository;

import com.medi.app.entity.StoreOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreOrderRepository extends JpaRepository<StoreOrder, Long> {

    Optional<StoreOrder> findByOrderNumber(String orderNumber);

    List<StoreOrder> findAllByOrderByCreatedAtDesc();

    List<StoreOrder> findByStoreIdOrderByCreatedAtDesc(Long storeId);

    List<StoreOrder> findByPlacedByUserIdOrderByCreatedAtDesc(Long userId);

    List<StoreOrder> findByOrderStatusOrderByCreatedAtDesc(String orderStatus);

    List<StoreOrder> findByPaymentMethodOrderByCreatedAtDesc(String paymentMethod);
}
