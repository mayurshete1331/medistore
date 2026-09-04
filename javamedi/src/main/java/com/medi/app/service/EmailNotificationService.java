package com.medi.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;

    @Value("${app.notifications.email.admin:mayurshete1331@gmail.com}")
    private String adminEmail;

    @Value("${app.notifications.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${spring.mail.username:mayurshete1331@gmail.com}")
    private String fromEmail;

    @Async
    public void sendEmail(String to, String subject, String text) {
        if (!emailEnabled) {
            log.info("Email notifications disabled. Skipping email to: {}", to);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
            log.info("Email successfully sent to: {} | Subject: {}", to, subject);
        } catch (Exception e) {
            log.warn("Could not send email to {} via Gmail SMTP (check app password/network): {}", to, e.getMessage());
        }
    }

    public void sendPurchaseOrderEmail(String supplierEmail, String medicineName, int qty, double estTotal, String notes) {
        String subject = "URGENT PURCHASE ORDER: " + medicineName + " (" + qty + " Packs) - Medi Pharmacy";
        String body = "Dear Supplier,\n\n"
                + "Please process our urgent stock reorder:\n"
                + "Medicine: " + medicineName + "\n"
                + "Quantity: " + qty + " Packs\n"
                + "Estimated Total: INR " + estTotal + "\n"
                + "Instructions: " + (notes != null ? notes : "Dispatch earliest batch with 1+ year shelf life.") + "\n\n"
                + "Delivery Address:\nMedi Pharmacy & Healthcare Store\nMain Counter, DL: MH-MZ4-20B-10928\nGSTIN: 27AABCM1122D1Z9\n\n"
                + "Authorized by Store Owner.";

        sendEmail(supplierEmail, subject, body);
        // Also CC admin email
        if (!supplierEmail.equalsIgnoreCase(adminEmail)) {
            sendEmail(adminEmail, "[PO COPY] " + subject, body);
        }
    }

    public void sendLowStockAlert(String medicineName, int currentStock, int reorderLevel) {
        String subject = "⚠️ LOW STOCK ALERT: " + medicineName;
        String body = "Attention Store Owner,\n\n"
                + "The following drug has reached or fallen below its reorder threshold:\n"
                + "Medicine: " + medicineName + "\n"
                + "Current Stock: " + currentStock + " packs\n"
                + "Reorder Level: " + reorderLevel + " packs\n\n"
                + "Please visit the Auto-Reorder portal to dispatch purchase orders via WhatsApp or Email.\n\n"
                + "Medi Store Management System";

        sendEmail(adminEmail, subject, body);
    }
}
