package com.tuatua.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendVerificationEmail(String to, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Xác thực tài khoản của bạn");
        String verificationUrl = "http://localhost:8080/api/auth/verify?token=" + token;
        message.setText("Chào bạn,\n\nVui lòng nhấp vào liên kết dưới đây để xác thực tài khoản của bạn:\n"
                + verificationUrl
                + "\n\nTrân trọng,\nĐội ngũ ứng dụng.");
        mailSender.send(message);
    }
}