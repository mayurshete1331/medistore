package com.medi.app.repository;

import com.medi.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(String role);
    Optional<User> findByPhone(String phone);

    @Query("SELECT u FROM User u WHERE u.role = 'CUSTOMER' AND (" +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "REPLACE(REPLACE(REPLACE(COALESCE(u.phone, ''), ' ', ''), '-', ''), '+', '') LIKE CONCAT('%', :cleanDigits, '%') OR " +
           "LOWER(COALESCE(u.phone, '')) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<User> searchCustomers(@Param("query") String query, @Param("cleanDigits") String cleanDigits);
}

