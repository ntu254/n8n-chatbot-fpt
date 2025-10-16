package com.fpt.chatbot_fptu.controller;

import com.fpt.chatbot_fptu.dto.EmailLoginRequest;
import com.fpt.chatbot_fptu.dto.GoogleLoginRequest;
import com.fpt.chatbot_fptu.dto.LoginResponse;
import com.fpt.chatbot_fptu.entity.Student;
import com.fpt.chatbot_fptu.repository.StudentRepository;
import com.fpt.chatbot_fptu.service.GoogleAuthService;
import com.fpt.chatbot_fptu.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private GoogleAuthService googleAuthService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private StudentRepository studentRepository;

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

    // Simple email/password login for mobile dev (issues JWT and creates user if missing)
    @PostMapping("/login")
    public ResponseEntity<?> loginWithEmail(@RequestBody EmailLoginRequest request) {
        try {
            String email = request.getEmail();
            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body("Email is required");
            }

            // Find existing student or create a minimal record
            Student student = studentRepository.findByEmail(email)
                    .orElseGet(() -> {
                        Student s = new Student();
                        s.setEmail(email);
                        // Use email as name placeholder if not provided
                        s.setName(email);
                        return studentRepository.save(s);
                    });

            String token = jwtService.generateToken(student);
            LoginResponse response = new LoginResponse(token, student);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error during email login: " + e.getMessage());
        }
    }
}
