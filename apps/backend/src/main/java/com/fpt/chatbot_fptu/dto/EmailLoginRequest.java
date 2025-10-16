package com.fpt.chatbot_fptu.dto;

import lombok.Data;

@Data
public class EmailLoginRequest {
    private String email;
    private String password;
}