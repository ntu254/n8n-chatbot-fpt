package com.tuatua.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(unique = true) // Thêm unique để định danh người dùng Google
    private String googleId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "major")
    private String major;

    @Lob // Dùng @Lob cho các trường văn bản dài (TEXT trong SQL)
    @Column(name = "goals")
    private String goals;

    @Lob
    @Column(name = "interests")
    private String interests;

    @Column(name = "gpa")
    private Double gpa;

    @Column(name = "risk_level")
    private String riskLevel;

    @Column
    private String password; // Lưu mật khẩu đã được mã hóa

    @Column(nullable = false)
    private boolean enabled = false; // Mặc định là false cho đến khi xác thực

    private String verificationToken;

    private LocalDateTime tokenExpiryDate; // <-- THÊM DÒNG NÀY

    // Thêm một trường để phân biệt người dùng đăng ký thông thường và Google
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider provider = AuthProvider.LOCAL;

    public enum AuthProvider {
        LOCAL,
        GOOGLE
    }
}
