package com.tuatua.controller;

import com.tuatua.dto.ChatRequest;
import com.tuatua.entity.ChatMessage;
import com.tuatua.service.ChatService; // Import service mới
import lombok.RequiredArgsConstructor; // Sử dụng constructor injection
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication; // Sử dụng Authentication thay vì Principal
import org.springframework.web.bind.annotation.*; // Thêm GetMapping

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor // Dùng constructor injection
public class ChatController {

    private final ChatService chatService; // Tiêm ChatService
    // Xóa RestTemplate và @Value n8nWebhookUrl ở đây

    /**
     * Endpoint để gửi tin nhắn mới đến bot.
     */
    @PostMapping
    public ResponseEntity<?> chatWithBot(@RequestBody ChatRequest chatRequest, Authentication authentication) {
        // Lấy email của người dùng đã xác thực từ đối tượng Authentication
        String userEmail = authentication.getName();

        try {
            // Gọi ChatService để xử lý
            String botResponse = chatService.processUserMessage(userEmail, chatRequest);
            // Trả về phản hồi của bot
            return ResponseEntity.ok(botResponse);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error processing chat message: " + e.getMessage());
        }
    }

    /**
     * Endpoint để lấy lịch sử chat của người dùng hiện tại.
     */
    @GetMapping("/history")
    public ResponseEntity<List<ChatMessage>> getChatHistory(Authentication authentication) {
        String userEmail = authentication.getName();
        try {
            List<ChatMessage> history = chatService.getChatHistory(userEmail);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(null); // Hoặc trả về lỗi cụ thể hơn
        }
    }
}