package com.tuatua.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

    public void sendPasswordResetEmail(String to, String code) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            String htmlMsg = "<body>"
                    + "<h2>Yêu cầu đặt lại mật khẩu</h2>"
                    + "<p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>"
                    + "<p>Mã xác thực của bạn là:</p>"
                    + "<h3 style='color:blue; font-size:24px; letter-spacing: 2px;'>" + code + "</h3>"
                    + "<p>Mã này sẽ hết hạn sau 10 phút.</p>"
                    + "<p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>"
                    + "<br><p>Trân trọng,<br>Đội ngũ ứng dụng</p>"
                    + "</body>";

            helper.setTo(to);
            helper.setSubject("Mã đặt lại mật khẩu của bạn");
            helper.setText(htmlMsg, true); // true để chỉ định đây là nội dung HTML

            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            throw new IllegalStateException("Không thể gửi email đặt lại mật khẩu.", e);
        }
    }
}