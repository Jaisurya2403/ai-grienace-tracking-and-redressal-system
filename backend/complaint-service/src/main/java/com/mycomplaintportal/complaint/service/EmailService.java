package com.mycomplaintportal.complaint.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    private static class InlineImageData {
        byte[] bytes;
        String contentType;
        public InlineImageData(byte[] bytes, String contentType) {
            this.bytes = bytes;
            this.contentType = contentType;
        }
    }

    private InlineImageData fetchImageData(String imgId) {
        try {
            if (imgId == null || imgId.trim().isEmpty()) return null;

            if (imgId.startsWith("data:image")) {
                int commaIdx = imgId.indexOf(",");
                if (commaIdx != -1) {
                    String header = imgId.substring(0, commaIdx);
                    String base64Data = imgId.substring(commaIdx + 1);
                    String mimeType = "image/jpeg";
                    if (header.contains("image/png")) mimeType = "image/png";
                    else if (header.contains("image/gif")) mimeType = "image/gif";
                    else if (header.contains("image/webp")) mimeType = "image/webp";

                    byte[] decoded = Base64.getDecoder().decode(base64Data);
                    return new InlineImageData(decoded, mimeType);
                }
            }

            String cleanId = imgId;
            if (cleanId.contains("/api/images/")) {
                cleanId = cleanId.substring(cleanId.lastIndexOf("/") + 1);
            }
            
            // Attempt fetching from image-storage-service (port 8087)
            String fetchUrl = cleanId.startsWith("http") ? cleanId : "http://localhost:8087/api/images/" + cleanId;
            HttpURLConnection conn = (HttpURLConnection) new URL(fetchUrl).openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(5000);

            if (conn.getResponseCode() == 200) {
                String contentType = conn.getContentType();
                if (contentType == null || !contentType.contains("image")) contentType = "image/jpeg";
                try (InputStream is = conn.getInputStream()) {
                    byte[] bytes = is.readAllBytes();
                    return new InlineImageData(bytes, contentType);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch image inline attachment for {}: {}", imgId, e.getMessage());
        }
        return null;
    }

    public void sendOfficerNotificationEmail(String officerEmail, String complaintId, String title, String description, String location, String pincode, String deptName, String trackingToken, List<String> attachmentImageIds) {
        String targetEmail = (officerEmail != null && officerEmail.contains("@") && !officerEmail.equalsIgnoreCase("alonewarrior123456@gmail.com")) 
                ? officerEmail 
                : "b.karthikeyan1000@gmail.com";
        String trackingLink = "http://localhost:5173/track/" + trackingToken;

        List<InlineImageData> inlineImages = new ArrayList<>();
        StringBuilder photoHtml = new StringBuilder();

        if (attachmentImageIds != null && !attachmentImageIds.isEmpty()) {
            photoHtml.append("<div style='margin-top: 16px;'><p style='margin: 0 0 8px 0;'><strong>Uploaded Photo Evidence:</strong></p><div>");
            for (int i = 0; i < attachmentImageIds.size(); i++) {
                String imgId = attachmentImageIds.get(i);
                InlineImageData data = fetchImageData(imgId);
                if (data != null && data.bytes != null && data.bytes.length > 0) {
                    String cidName = "img_" + i;
                    inlineImages.add(data);
                    photoHtml.append("<img src='cid:").append(cidName).append("' alt='Grievance Photo Evidence' style='width: 100%; max-width: 500px; height: auto; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 8px; display: block;' />");
                }
            }
            photoHtml.append("</div></div>");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("alonewarrior123456@gmail.com");
            helper.setTo(targetEmail);
            helper.setSubject("🚨 New Grievance Assigned: #" + complaintId + " - " + title);

            String htmlBody = "<div style='font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto;'>" +
                    "<div style='background: linear-gradient(135deg, #1e293b, #0f172a); padding: 16px 24px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 20px;'>" +
                    "<h2 style='margin: 0; font-size: 20px;'>🚨 New Civic Grievance Assignment</h2>" +
                    "<span style='font-size: 12px; color: #94a3b8;'>MyComplaintPortal Department Alert</span>" +
                    "</div>" +

                    "<div style='background: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; margin-bottom: 20px;'>" +
                    "<p style='margin: 0 0 10px 0;'><strong>Complaint ID:</strong> <span style='color: #2563eb; font-weight: bold;'>" + complaintId + "</span></p>" +
                    "<p style='margin: 0 0 10px 0;'><strong>Title:</strong> " + title + "</p>" +
                    "<p style='margin: 0 0 10px 0;'><strong>Assigned Department:</strong> " + deptName + "</p>" +
                    "<p style='margin: 0 0 10px 0;'><strong>Location / Pincode:</strong> " + location + " (Pincode: " + pincode + ")</p>" +
                    "<p style='margin: 0 0 10px 0;'><strong>Issue Description:</strong></p>" +
                    "<blockquote style='margin: 8px 0; padding: 12px; background: #f1f5f9; border-left: 4px solid #2563eb; font-style: italic; color: #334155;'>" + description + "</blockquote>" +
                    photoHtml.toString() +
                    "</div>" +

                    "<div style='text-align: center; margin-top: 24px; margin-bottom: 12px;'>" +
                    "<a href='" + trackingLink + "' style='background-color: #2563eb; color: #ffffff; padding: 14px 28px; font-weight: bold; text-decoration: none; border-radius: 30px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3);'>Inspect Grievance & Track Status</a>" +
                    "</div>" +
                    "<p style='font-size: 11px; text-align: center; color: #64748b;'>Officer Direct Access Link: <a href='" + trackingLink + "'>" + trackingLink + "</a></p>" +
                    "</div>";

            helper.setText(htmlBody, true);

            // Add CID inline images
            for (int i = 0; i < inlineImages.size(); i++) {
                InlineImageData imgData = inlineImages.get(i);
                helper.addInline("img_" + i, new ByteArrayResource(imgData.bytes), imgData.contentType);
            }

            mailSender.send(message);

            log.info("Officer notification email successfully dispatched via JavaMailSender to: {}", targetEmail);
            System.out.println("=================================================================");
            System.out.println("🚨 OFFICER NOTIFICATION EMAIL DISPATCHED TO: " + targetEmail);
            System.out.println("📋 COMPLAINT ID: " + complaintId + " | TRACKING LINK: " + trackingLink);
            System.out.println("=================================================================");
        } catch (Exception e) {
            log.error("SMTP Exception sending officer notification email to {}: {}", targetEmail, e.getMessage());
            System.out.println("=================================================================");
            System.out.println("⚠️ SMTP NOTICE FOR OFFICER EMAIL (" + targetEmail + "): " + e.getMessage());
            System.out.println("📋 COMPLAINT ID: " + complaintId + " | TRACKING LINK: " + trackingLink);
            System.out.println("=================================================================");
        }
    }

    public void sendCitizenProblemSolvedEmail(String citizenEmail, String complaintId, String title, String officerNotes) {
        String targetEmail = (citizenEmail != null && citizenEmail.contains("@")) 
                ? citizenEmail.trim() 
                : "717824p120@kce.ac.in";
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("alonewarrior123456@gmail.com");
            helper.setTo(targetEmail);
            helper.setSubject("🎉 Problem Solved: Grievance #" + complaintId + " Resolved");

            String htmlBody = "<div style='font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto;'>" +
                    "<div style='background: linear-gradient(135deg, #059669, #047857); padding: 16px 24px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 20px;'>" +
                    "<h2 style='margin: 0; font-size: 20px;'>🎉 Grievance Resolved & Verified</h2>" +
                    "<span style='font-size: 12px; color: #a7f3d0;'>MyComplaintPortal Resolution Notification</span>" +
                    "</div>" +

                    "<p style='color: #334155;'>Your reported issue <strong>#" + complaintId + " (" + title + ")</strong> has been successfully fixed by the department officer.</p>" +
                    "<p><strong>Officer Resolution Notes:</strong> " + (officerNotes != null ? officerNotes : "Issue resolved and verified on-site.") + "</p>" +
                    "<p style='color: #64748b; font-size: 13px; margin-top: 20px;'>Thank you for making our city better!</p>" +
                    "</div>";

            helper.setText(htmlBody, true);
            mailSender.send(message);

            log.info("Citizen problem solved notification email sent via JavaMailSender to: {}", targetEmail);
            System.out.println("=================================================================");
            System.out.println("🎉 CITIZEN PROBLEM SOLVED EMAIL DISPATCHED TO: " + targetEmail);
            System.out.println("📋 COMPLAINT ID: " + complaintId);
            System.out.println("=================================================================");
        } catch (Exception e) {
            log.error("SMTP Exception sending problem solved email to {}: {}", targetEmail, e.getMessage());
        }
    }
}
