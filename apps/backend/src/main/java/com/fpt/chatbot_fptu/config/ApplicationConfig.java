package com.fpt.chatbot_fptu.config;

import com.fpt.chatbot_fptu.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Collections;

@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final StudentRepository studentRepository;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            // Tìm kiếm Student trong database bằng email (username)
            return studentRepository.findByEmail(username)
                    // Nếu tìm thấy, chuyển đổi Student thành đối tượng UserDetails
                    .map(student -> new User(
                            student.getEmail(),
                            "", // Password không cần thiết vì ta dùng Google Login
                            Collections.emptyList() // Authorities/Roles, tạm thời để trống
                    ))
                    // Nếu không tìm thấy, ném ra exception chuẩn của Spring Security
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
        };
    }
}