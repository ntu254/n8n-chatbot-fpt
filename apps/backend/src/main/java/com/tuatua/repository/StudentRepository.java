package com.tuatua.repository;

import com.tuatua.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    // Spring Data JPA sẽ tự động tạo câu query dựa trên tên phương thức
    // Ví dụ: tìm sinh viên bằng email
    Optional<Student> findByEmail(String email);

    Optional<Student> findByVerificationToken(String token);

}