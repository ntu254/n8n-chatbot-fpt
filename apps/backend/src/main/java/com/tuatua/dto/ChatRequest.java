package com.tuatua.dto;

import lombok.Data;

@Data
public class ChatRequest {
    private String chatInput;
    // Bạn có thể thêm sessionId từ client nếu muốn,
    // nhưng tạo sessionId từ user đã đăng nhập ở backend sẽ an toàn hơn.
}
