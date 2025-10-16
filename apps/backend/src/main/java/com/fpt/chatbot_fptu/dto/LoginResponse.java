package com.fpt.chatbot_fptu.dto;

import com.fpt.chatbot_fptu.entity.Student;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private Student user;
}
