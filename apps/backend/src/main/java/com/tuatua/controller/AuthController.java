package com.tuatua.controller;

import com.tuatua.dto.*;
import com.tuatua.entity.Student;
import com.tuatua.service.EmailService;
import com.tuatua.service.GoogleAuthService;
import com.tuatua.service.JwtService;
import com.tuatua.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private StudentService studentService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private GoogleAuthService googleAuthService;

    @Autowired
    private JwtService jwtService;

    /**
     * Endpoint để yêu cầu mã reset mật khẩu.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        try {
            String resetCode = studentService.generatePasswordResetCode(request.getEmail());
            emailService.sendPasswordResetEmail(request.getEmail(), resetCode);
            return ResponseEntity.ok("Mã đặt lại mật khẩu đã được gửi đến email của bạn.");
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Endpoint để đặt lại mật khẩu mới.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        try {
            studentService.resetPassword(request);
            return ResponseEntity.ok("Đặt lại mật khẩu thành công! Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.");
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Endpoint để người dùng yêu cầu gửi lại email xác thực.
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody @Valid ResendTokenRequest request) {
        try {
            Student updatedStudent = studentService.resendVerificationToken(request.getEmail());
            emailService.sendVerificationEmail(updatedStudent.getEmail(), updatedStudent.getVerificationToken());
            return ResponseEntity.ok("Một email xác thực mới đã được gửi. Vui lòng kiểm tra hòm thư của bạn.");
        } catch (IllegalStateException e) {
            // Trả về lỗi nếu email không tồn tại hoặc tài khoản đã được kích hoạt
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Endpoint để người dùng đăng ký tài khoản mới
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        try {
            Student newStudent = studentService.registerNewStudent(registerRequest);
            emailService.sendVerificationEmail(newStudent.getEmail(), newStudent.getVerificationToken());
            return ResponseEntity.ok("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    /**
     * Endpoint xác nhận việc đăng ký của người dùng bằng cách gửi mail
     */

    @GetMapping("/verify")
    public ResponseEntity<?> verifyAccount(@RequestParam("token") String token) {
        Optional<Student> studentOpt = studentService.verifyStudent(token);
        if (studentOpt.isPresent()) {
            return ResponseEntity.ok("Xác thực tài khoản thành công! Bây giờ bạn có thể đăng nhập.");
        } else {
            return ResponseEntity.badRequest().body("Token không hợp lệ hoặc đã hết hạn.");
        }
    }

    /*
    xác nhận việc đăng ký của người dùng sau đó chuyển hướng đến app

    @GetMapping("/verify")
    public ResponseEntity<?> verifyAccount(@RequestParam("token") String token) {
        Optional<Student> studentOpt = studentService.verifyStudent(token);

        // Cấu hình URL của frontend
        String frontendUrl = "http://localhost:3000"; // Hoặc URL trang web của bạn

        if (studentOpt.isPresent()) {
            // Chuyển hướng đến trang thành công
            HttpHeaders headers = new HttpHeaders();
            headers.setLocation(URI.create(frontendUrl + "/verification-success"));
            return new ResponseEntity<>(headers, HttpStatus.FOUND); // Mã 302 FOUND
        } else {
            // Chuyển hướng đến trang thất bại
            HttpHeaders headers = new HttpHeaders();
            headers.setLocation(URI.create(frontendUrl + "/verification-failure"));
            return new ResponseEntity<>(headers, HttpStatus.FOUND);
        }
    }
     */

    /**
     * Endpoint đăng nhập bằng account local
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Optional<Student> studentOpt = studentService.findByEmail(loginRequest.getEmail());
        if (studentOpt.isEmpty() || !studentOpt.get().isEnabled()) {
            return ResponseEntity.status(401).body("Tài khoản không tồn tại hoặc chưa được xác thực.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        Student student = studentOpt.get();
        String jwt = jwtService.generateToken(student);
        LoginResponse response = new LoginResponse(jwt, student);

        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint đăng nhập bằng google
     */
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
