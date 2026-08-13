package com.mycomplaintportal.auth.repository;

import com.mycomplaintportal.auth.entity.AdminAuth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminAuthRepository extends JpaRepository<AdminAuth, String> {

    Optional<AdminAuth> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
