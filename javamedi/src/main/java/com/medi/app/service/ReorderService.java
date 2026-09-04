package com.medi.app.service;

import com.medi.app.entity.Medicine;
import com.medi.app.entity.Supplier;
import com.medi.app.repository.MedicineRepository;
import com.medi.app.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReorderService {

    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;

    public List<Medicine> getLowStockMedicines() {
        return medicineRepository.findLowStockMedicines();
    }

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public String generateWhatsAppUrl(Long medicineId, Integer customQty, Long supplierId, String notes) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + medicineId));

        Supplier supplier = (supplierId != null ? supplierRepository.findById(supplierId).orElse(null) : null);
        if (supplier == null) {
            supplier = supplierRepository.findAll().stream().findFirst().orElse(null);
        }

        String phone = supplier != null && supplier.getWhatsappNumber() != null 
                ? supplier.getWhatsappNumber().replaceAll("[^0-9]", "") 
                : "919876543210";

        int orderQty = (customQty != null && customQty > 0) ? customQty : medicine.getDefaultReorderQty();
        double unitCost = !medicine.getBatches().isEmpty() ? medicine.getBatches().get(0).getPurchasePrice() : 100.0;
        double totalCost = Math.round(unitCost * orderQty * 100.0) / 100.0;

        String message = 
                "*🏥 PURCHASE ORDER - MEDI PHARMACY*\n" +
                "----------------------------------------\n" +
                "*To:* " + (supplier != null ? supplier.getName() : "Distributor") + "\n" +
                "*Attn:* " + (supplier != null ? supplier.getContactPerson() : "Sales Dept") + "\n\n" +
                "*URGENT STOCK REORDER REQUEST:*\n" +
                "• *Medicine:* " + medicine.getBrandName() + "\n" +
                "• *Composition:* " + medicine.getGenericName() + "\n" +
                "• *Packaging:* " + medicine.getPackaging() + "\n" +
                "• *Order Qty:* " + orderQty + " Packs\n" +
                "• *Est. Rate:* ₹" + unitCost + "/pack\n" +
                "• *Est. Total:* ₹" + totalCost + "\n\n" +
                "*Special Instructions:*\n" +
                (notes != null && !notes.trim().isEmpty() ? notes : "Please dispatch earliest batch with min 12+ months expiry.") + "\n\n" +
                "*Authorized by:* Store Owner / Chief Pharmacist\n" +
                "*Timestamp:* " + LocalDateTime.now() + "\n" +
                "----------------------------------------\n" +
                "_Generated via Medi Store Management System (Java Spring Boot)_";

        return "https://api.whatsapp.com/send?phone=" + phone + "&text=" + URLEncoder.encode(message, StandardCharsets.UTF_8);
    }

    public String generateEmailUrl(Long medicineId, Integer customQty, Long supplierId, String notes) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + medicineId));

        Supplier supplier = (supplierId != null ? supplierRepository.findById(supplierId).orElse(null) : null);
        if (supplier == null) {
            supplier = supplierRepository.findAll().stream().findFirst().orElse(null);
        }

        String email = supplier != null ? supplier.getEmail() : "orders@pharma.com";
        int orderQty = (customQty != null && customQty > 0) ? customQty : medicine.getDefaultReorderQty();

        String subject = "Purchase Order [URGENT]: " + medicine.getBrandName() + " (" + orderQty + " Packs) - Medi Pharmacy";
        String body = "Dear " + (supplier != null ? supplier.getName() : "Distributor") + ",\n\n" +
                "Please process our purchase order for the following medicine urgently:\n\n" +
                "Medicine Name: " + medicine.getBrandName() + "\n" +
                "Composition: " + medicine.getGenericName() + "\n" +
                "Packaging: " + medicine.getPackaging() + "\n" +
                "Quantity Required: " + orderQty + " Packs\n\n" +
                "Notes: " + (notes != null ? notes : "Min 1-year expiry batches required.") + "\n\n" +
                "Delivery Address:\n" +
                "Medi Pharmacy & Healthcare SuperStore\n" +
                "DL No: 20B/MH-MZ4-10928, 21B/MH-MZ4-10929\n\n" +
                "Authorized by Store Owner.";

        return "mailto:" + email + "?subject=" + URLEncoder.encode(subject, StandardCharsets.UTF_8) +
                "&body=" + URLEncoder.encode(body, StandardCharsets.UTF_8);
    }
}
