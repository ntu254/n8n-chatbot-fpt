package com.tuatua.service;

import com.tuatua.dto.ChatRequest;
import com.tuatua.dto.N8nRequest;
import com.tuatua.entity.ChatMessage;
import com.tuatua.entity.Student;
import com.tuatua.repository.ChatMessageRepository;
import com.tuatua.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final StudentRepository studentRepository; // Để lấy đối tượng Student
    private final RestTemplate restTemplate;

    @Value("${n8n.webhook.url}")
    private String n8nWebhookUrl;

    /**
     * Xử lý tin nhắn đến từ người dùng, gọi n8n và lưu lịch sử.
     * @param userEmail Email của người dùng đã xác thực.
     * @param chatRequest DTO chứa tin nhắn của người dùng.
     * @return Phản hồi từ bot.
     * @throws RuntimeException nếu gọi n8n thất bại.
     */
    @Transactional // Đảm bảo cả hai lần lưu là một giao dịch
    public String processUserMessage(String userEmail, ChatRequest chatRequest) {
        // 1. Lấy thông tin Student từ email
        Student student = studentRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy Student với email: " + userEmail));

        // 2. Lưu tin nhắn của người dùng
        ChatMessage userMessage = new ChatMessage(student, ChatMessage.SenderType.USER, chatRequest.getChatInput());
        chatMessageRepository.save(userMessage);

        // 3. Tạo sessionId và gọi n8n (logic cũ từ ChatController)
        String sessionId = "user-session-" + userEmail;
        N8nRequest n8nRequest = new N8nRequest(chatRequest.getChatInput(), sessionId);

        ResponseEntity<String> n8nResponse;
        try {
            n8nResponse = restTemplate.postForEntity(n8nWebhookUrl, n8nRequest, String.class);
        } catch (Exception e) {
            // Có thể lưu một tin nhắn lỗi vào DB nếu muốn
            throw new RuntimeException("Error connecting to the AI service.", e);
        }

        String botResponseContent = n8nResponse.getBody();
        if (botResponseContent == null) {
            botResponseContent = "Xin lỗi, đã có lỗi xảy ra."; // Hoặc phản hồi mặc định
        }

        // 4. Lưu tin nhắn phản hồi của bot
        ChatMessage botMessage = new ChatMessage(student, ChatMessage.SenderType.BOT, botResponseContent);
        chatMessageRepository.save(botMessage);

        // 5. Trả về nội dung phản hồi của bot
        return botResponseContent;
    }

    /**
     * Lấy lịch sử chat của người dùng.
     * @param userEmail Email của người dùng đã xác thực.
     * @return Danh sách tin nhắn, sắp xếp theo thời gian mới nhất trước.
     */
    public List<ChatMessage> getChatHistory(String userEmail) {
        Student student = studentRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy Student với email: " + userEmail));
        return chatMessageRepository.findByStudentOrderByTimestampDesc(student);
    }
}