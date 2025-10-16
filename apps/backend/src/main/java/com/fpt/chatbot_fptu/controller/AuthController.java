package com.fpt.chatbot_fptu.controller;

import com.fpt.chatbot_fptu.dto.GoogleLoginRequest;
import com.fpt.chatbot_fptu.dto.LoginResponse;
import com.fpt.chatbot_fptu.entity.Student;
import com.fpt.chatbot_fptu.service.GoogleAuthService;
import com.fpt.chatbot_fptu.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private GoogleAuthService googleAuthService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleLoginRequest request) {
        try {
            // 1. Xác thực người dùng và lưu vào DB (giữ nguyên)
            Student student = googleAuthService.processUserLogin(request.getCode());

            // 2. Tạo JWT từ thông tin người dùng
            String token = jwtService.generateToken(student);

            // 3. Trả về token và thông tin người dùng cho frontend
            LoginResponse response = new LoginResponse(token, student);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi ra console để debug
            return ResponseEntity.badRequest().body("Error during Google authentication: " + e.getMessage());
        }
    }
}
