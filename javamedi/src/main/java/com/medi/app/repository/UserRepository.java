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

    @Query("SELECT u FROM User u WHERE (u.role = 'CUSTOMER' OR u.role IS NULL) AND (" +
           "(:query <> '' AND (LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))) OR " +
           "(:cleanDigits <> '' AND LENGTH(:cleanDigits) >= 3 AND (" +
           "REPLACE(REPLACE(REPLACE(COALESCE(u.phone, ''), ' ', ''), '-', ''), '+', '') = :cleanDigits OR " +
           "REPLACE(REPLACE(REPLACE(COALESCE(u.phone, ''), ' ', ''), '-', ''), '+', '') LIKE CONCAT('%', :cleanDigits, '%'))))")
    List<User> searchCustomers(@Param("query") String query, @Param("cleanDigits") String cleanDigits);
}

