package com.fpt.chatbot_fptu.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class N8nRequest {
    private String chatInput;
    private String sessionId;
}
