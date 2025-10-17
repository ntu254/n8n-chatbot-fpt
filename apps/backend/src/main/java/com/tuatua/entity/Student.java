package com.tuatua.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

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
}
