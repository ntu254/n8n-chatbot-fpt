package com.tuatua.repository;

import com.tuatua.entity.ChatMessage;
import com.tuatua.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Tìm tất cả tin nhắn của một student, sắp xếp theo thời gian mới nhất trước
    List<ChatMessage> findByStudentOrderByTimestampDesc(Student student);

    // (Tùy chọn) Tìm tin nhắn theo student và sessionId nếu bạn thêm sessionId vào entity
    // List<ChatMessage> findByStudentAndSessionIdOrderByTimestampAsc(Student student, String sessionId);
}