package com.fpt.chatbot_fptu.controller;

import com.fpt.chatbot_fptu.dto.ChatRequest;
import com.fpt.chatbot_fptu.dto.N8nRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.security.Principal;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${n8n.webhook.url}")
    private String n8nWebhookUrl;

    @PostMapping
    public ResponseEntity<String> chatWithBot(@RequestBody ChatRequest chatRequest, Principal principal) {
        // `Principal principal` được Spring Security tự động tiêm vào
        // nếu người dùng đã xác thực thành công qua JWT.
        // principal.getName() thường sẽ là username (email trong trường hợp của chúng ta).

        // Tạo sessionId ổn định dựa trên người dùng đã đăng nhập.
        // Điều này giúp n8n duy trì ngữ cảnh cho từng người dùng riêng biệt[cite: 53].
        String sessionId = "user-session-" + principal.getName();

        // Chuẩn bị request để gửi đến n8n.
        N8nRequest n8nRequest = new N8nRequest(chatRequest.getChatInput(), sessionId);

        try {
            // Gọi đến webhook của n8n và chuyển tiếp request[cite: 54, 130].
            ResponseEntity<String> n8nResponse = restTemplate.postForEntity(n8nWebhookUrl, n8nRequest, String.class);

            // Trả response của n8n về thẳng cho frontend.
            return ResponseEntity.ok(n8nResponse.getBody());
        } catch (Exception e) {
            // Xử lý lỗi nếu không gọi được n8n
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error connecting to the AI service.");
        }
    }
}
