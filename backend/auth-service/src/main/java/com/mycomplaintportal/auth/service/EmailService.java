package com.mycomplaintportal.auth.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtp(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("alonewarrior123456@gmail.com");
            helper.setTo(toEmail);
            helper.setSubject("Your MyComplaintPortal Verification Code");

            String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;'>" +
                    "<h2 style='color: #0f172a;'>🔒 Email Verification Code</h2>" +
                    "<p style='color: #475569;'>Your 6-digit verification code for MyComplaintPortal is:</p>" +
                    "<div style='font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; padding: 12px 24px; background: #ffffff; display: inline-block; border-radius: 8px; border: 2px solid #cbd5e1;'>" + otp + "</div>" +
                    "<p style='color: #64748b; font-size: 13px; margin-top: 16px;'>This code is valid for 5 minutes. If you did not request this code, please ignore this message.</p>" +
                    "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Live OTP email sent successfully via JavaMailSender to: {}", toEmail);
            System.out.println("=================================================================");
            System.out.println("📧 LIVE EMAIL DISPATCHED TO: " + toEmail);
            System.out.println("🔑 6-DIGIT OTP CODE: " + otp);
            System.out.println("=================================================================");
        } catch (Exception e) {
            log.error("Failed to send live OTP email to {}: {}", toEmail, e.getMessage());
            System.out.println("=================================================================");
            System.out.println("⚠️ SMTP NOTICE FOR: " + toEmail + " | 6-DIGIT OTP CODE: " + otp);
            System.out.println("=================================================================");
        }
    }
}
