package com.tuatua.repository;

import com.tuatua.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    // Spring Data JPA sẽ tự động tạo câu query dựa trên tên phương thức
    // Ví dụ: tìm sinh viên bằng email
    Optional<Student> findByEmail(String email);

    Optional<Student> findByVerificationToken(String token);

    // Tìm tất cả student có verification token đã hết hạn
    List<Student> findAllByVerificationTokenIsNotNullAndTokenExpiryDateBefore(LocalDateTime now);

    // Tìm tất cả student có password reset code đã hết hạn
    List<Student> findAllByPasswordResetCodeIsNotNullAndResetCodeExpiryDateBefore(LocalDateTime now);

}