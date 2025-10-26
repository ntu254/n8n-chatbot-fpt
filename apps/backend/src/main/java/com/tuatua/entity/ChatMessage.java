package com.tuatua.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor // Lombok constructor không tham số
@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // Liên kết Many-to-One với Student
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SenderType sender; // Ai là người gửi: USER hay BOT

    @Lob // Dùng cho cột TEXT trong Postgres để lưu nội dung dài
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp // Tự động gán thời gian khi tạo
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    // Enum để định nghĩa người gửi
    public enum SenderType {
        USER,
        BOT
    }

    // Constructor tiện lợi (tùy chọn)
    public ChatMessage(Student student, SenderType sender, String content) {
        this.student = student;
        this.sender = sender;
        this.content = content;
    }
}