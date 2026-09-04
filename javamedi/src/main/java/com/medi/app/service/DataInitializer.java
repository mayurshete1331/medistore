package com.medi.app.service;

import com.medi.app.entity.*;
import com.medi.app.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PartnerStoreRepository partnerStoreRepository;
    private final SupplierRepository supplierRepository;
    private final MedicineRepository medicineRepository;
    private final BatchRepository batchRepository;
    private final InvoiceRepository invoiceRepository;
    private final StoreOrderRepository storeOrderRepository;
    private final StoreAffiliationRepository storeAffiliationRepository;
    private final StoreHistoryLogRepository storeHistoryLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking database data status. Users in DB: {}, Medicines in DB: {}",
                userRepository.count(), medicineRepository.count());

        if (userRepository.count() < 11 || medicineRepository.count() < 8) {
            log.info("Populating database with full Medi platform catalog & 11 users (3 Owners, 3 Doctors, 5 Customers)...");
            seedAllData();
        } else {
            log.info("Database is fully initialized with {} users and {} medicines.",
                    userRepository.count(), medicineRepository.count());
        }

        if (storeAffiliationRepository.count() == 0) {
            log.info("Seeding store affiliations for multi-store scoping...");
            seedAffiliations();
        }

        if (storeHistoryLogRepository.count() == 0) {
            log.info("Seeding store audit history logs...");
            seedHistoryLogs();
        }
    }

    @Transactional
    public void seedAllData() {
        String defaultPass = passwordEncoder.encode("123456");

        // ==========================================
        // 1. Seed 11 Users (3 Owners, 3 Doctors, 5 Customers)
        // ==========================================
        
        // --- 3 Store Owners ---
        createUserIfAbsent("Rajesh Patel", "owner@medicare.com", defaultPass, "STORE_OWNER",
                "+91 98765 43210", "🏪", 1L, "MediCare Pharmacy & SuperStore (Main Branch)",
                null, null, null, null);

        createUserIfAbsent("Amit Shah", "amit.owner@healthfirst.in", defaultPass, "STORE_OWNER",
                "+91 91234 56780", "🏥", 2L, "HealthFirst 24x7 Chemist & Druggists",
                null, null, null, null);

        createUserIfAbsent("Suresh Deshmukh", "suresh.owner@apexlifeline.com", defaultPass, "STORE_OWNER",
                "+91 99887 76650", "🏬", 3L, "Apex LifeLine Pharmacy & Surgical Store",
                null, null, null, null);

        // --- 3 Doctors ---
        createUserIfAbsent("Dr. Sneha Roy, MBBS, MD", "dr.sneha@clinic.org", defaultPass, "DOCTOR",
                "+91 98201 88990", "🩺", null, null,
                "MMC-2016-89421", "Internal Medicine & Chronic Care", "Roy Medical Chambers, Suite 204, Mumbai", null);

        createUserIfAbsent("Dr. Rajesh Sharma, MD (Cardiology)", "dr.sharma@heartcare.org", defaultPass, "DOCTOR",
                "+91 98203 11229", "❤️‍🩹", null, null,
                "MMC-2012-45211", "Cardiologist & Hypertension Specialist", "Apex Heart Institute, Sector 15, Thane", null);

        createUserIfAbsent("Dr. Priya Patel, MBBS, DCH (Pediatrics)", "dr.priya@childhealth.org", defaultPass, "DOCTOR",
                "+91 98111 22334", "👶", null, null,
                "MMC-2018-77123", "Consultant Pediatrician & Neonatologist", "Little Stars Children Clinic, Kothrud, Pune", null);

        // --- 5 Customers ---
        createUserIfAbsent("Vikram Malhotra", "vikram.m@gmail.com", defaultPass, "CUSTOMER",
                "+91 98199 44332", "👤", null, null,
                null, null, null, "Flat 402, Green Meadows Tower, Link Road, Andheri West, Mumbai 400053");

        createUserIfAbsent("Sunita Sharma", "sunita.sharma@yahoo.co.in", defaultPass, "CUSTOMER",
                "+91 98202 55661", "👩", null, null,
                null, null, null, "B-14, Shanti Niketan CHS, S.V. Road, Borivali West, Mumbai 400092");

        createUserIfAbsent("Rahul Verma", "rahul.verma@gmail.com", defaultPass, "CUSTOMER",
                "+91 98333 11224", "👨", null, null,
                null, null, null, "Row House 7, Silver Oak Enclave, Paud Road, Kothrud, Pune 411038");

        createUserIfAbsent("Ananya Iyer", "ananya.iyer@outlook.com", defaultPass, "CUSTOMER",
                "+91 98444 66778", "👩‍💼", null, null,
                null, null, null, "A-501, Palm Beach Residency, Sector 19D, Vashi, Navi Mumbai 400703");

        createUserIfAbsent("Deepak Kulkarni", "deepak.k@gmail.com", defaultPass, "CUSTOMER",
                "+91 98555 99880", "👨‍💼", null, null,
                null, null, null, "Flat 303, Highland Park, Pokhran Road No. 2, Thane West 400610");

        // ==========================================
        // 2. Seed Partner Stores (3 Stores)
        // ==========================================
        if (partnerStoreRepository.count() == 0) {
            PartnerStore s1 = PartnerStore.builder()
                    .name("MediCare Pharmacy & SuperStore (Main Branch)")
                    .address("Shop 4 & 5, Health Square, Medical Zone, Mumbai 400012")
                    .phone("+91 98765 43210")
                    .email("orders@medicare.com")
                    .dlNumber("20B/MH-MZ4-10928, 21B/MH-MZ4-10929")
                    .gstin("27AABCM1122D1Z9")
                    .distance("0.4 km")
                    .rating(4.9)
                    .isOpen(true)
                    .deliveryAvailable(true)
                    .codAvailable(true)
                    .build();

            PartnerStore s2 = PartnerStore.builder()
                    .name("HealthFirst 24x7 Chemist & Druggists")
                    .address("Near Ruby Hall Clinic, Shivaji Nagar, Pune 411005")
                    .phone("+91 91234 56789")
                    .email("pune@healthfirst.in")
                    .dlNumber("20B/MH-PUN-34190, 21B/MH-PUN-34191")
                    .gstin("27AABCH9988C1Z4")
                    .distance("1.8 km")
                    .rating(4.7)
                    .isOpen(true)
                    .deliveryAvailable(true)
                    .codAvailable(true)
                    .build();

            PartnerStore s3 = PartnerStore.builder()
                    .name("Apex LifeLine Pharmacy & Surgical Store")
                    .address("G-12, Highland Complex, Majiwada, Thane West 400601")
                    .phone("+91 99887 76655")
                    .email("care@apexlifeline.com")
                    .dlNumber("20B/MH-THN-88120, 21B/MH-THN-88121")
                    .gstin("27AABCA7766K1Z1")
                    .distance("3.2 km")
                    .rating(4.8)
                    .isOpen(true)
                    .deliveryAvailable(true)
                    .codAvailable(true)
                    .build();

            partnerStoreRepository.saveAll(List.of(s1, s2, s3));
        }

        // ==========================================
        // 3. Seed Suppliers (3 Suppliers)
        // ==========================================
        if (supplierRepository.count() == 0) {
            Supplier sup1 = Supplier.builder()
                    .name("Apollo MedSolutions & Distributors")
                    .contactPerson("Ramesh Patel")
                    .phone("+91 98765 43210")
                    .whatsappNumber("+919876543210")
                    .email("orders@apollomedsolutions.com")
                    .gstin("27AABCA1234F1Z8")
                    .drugLicenseNo("MH-MZ4-20B-10928")
                    .address("Plot 42, Pharma Zone, MIDC Industrial Area, Mumbai 400093")
                    .build();

            Supplier sup2 = Supplier.builder()
                    .name("MediLife Pharma Distributors")
                    .contactPerson("Sanjay Sharma")
                    .phone("+91 91234 56789")
                    .whatsappNumber("+919123456789")
                    .email("supply@medilifepharma.in")
                    .gstin("27AABCM9876E1Z5")
                    .drugLicenseNo("MH-PUN-21B-45812")
                    .address("Shop 12-14, Laxmi Market, Drug Quarter, Pune 411002")
                    .build();

            Supplier sup3 = Supplier.builder()
                    .name("Sunrise Care & Surgical Supplies")
                    .contactPerson("Dr. Vivek Verma")
                    .phone("+91 99887 76655")
                    .whatsappNumber("+919988776655")
                    .email("care@sunrisesurgicals.com")
                    .gstin("27AABCS5544G1Z2")
                    .drugLicenseNo("MH-THN-20B-78321")
                    .address("B-7, Logistics Hub, Bhiwandi, Thane 421302")
                    .build();

            supplierRepository.saveAll(List.of(sup1, sup2, sup3));
        }

        // ==========================================
        // 4. Seed Medicines & Batches (16 Indian Formulations)
        // ==========================================
        seedMedicineIfAbsent("Augmentin 625 Duo", "Amoxicillin (500mg) + Clavulanic Acid (125mg)", "Tablet",
                "GlaxoSmithKline Pharmaceuticals", "30041010", 12, "10 Tablets/Strip", 10, "Tab", "Rack A-01",
                true, false, false, 25, 50, "AUG2408", "2024-02", "2025-08", 145.0, 201.71, 195.0, 14);

        seedMedicineIfAbsent("Dolo 650", "Paracetamol (650mg)", "Tablet",
                "Micro Labs Ltd", "30049060", 12, "15 Tablets/Strip", 15, "Tab", "Rack A-02",
                false, false, false, 40, 100, "DL65-11", "2024-04", "2026-03", 22.5, 33.60, 32.0, 85);

        seedMedicineIfAbsent("Pan 40", "Pantoprazole Gastro-resistant (40mg)", "Tablet",
                "Alkem Laboratories Ltd", "30049099", 12, "15 Tablets/Strip", 15, "Tab", "Rack B-03",
                true, false, false, 30, 60, "PAN4-90", "2024-01", "2025-12", 110.0, 155.0, 150.0, 52);

        seedMedicineIfAbsent("Pan-D", "Pantoprazole (40mg) + Domperidone SR (30mg)", "Capsule",
                "Alkem Laboratories Ltd", "30049099", 12, "15 Capsules/Strip", 15, "Cap", "Rack B-04",
                true, false, false, 30, 60, "PAND-44", "2024-03", "2025-10", 135.0, 199.0, 190.0, 38);

        seedMedicineIfAbsent("Azithral 500", "Azithromycin (500mg)", "Tablet",
                "Alembic Pharmaceuticals Ltd", "30042010", 12, "5 Tablets/Strip", 5, "Tab", "Rack A-05",
                true, true, false, 20, 40, "AZT-220", "2024-03", "2025-09", 85.0, 132.0, 128.0, 8);

        seedMedicineIfAbsent("Telma 40", "Telmisartan (40mg)", "Tablet",
                "Glenmark Pharmaceuticals Ltd", "30049099", 12, "15 Tablets/Strip", 15, "Tab", "Rack C-01",
                true, false, false, 25, 50, "TLM-789", "2024-05", "2026-04", 150.0, 220.0, 210.0, 42);

        seedMedicineIfAbsent("Telma-H", "Telmisartan (40mg) + Hydrochlorothiazide (12.5mg)", "Tablet",
                "Glenmark Pharmaceuticals Ltd", "30049099", 12, "15 Tablets/Strip", 15, "Tab", "Rack C-02",
                true, false, false, 20, 40, "TLMH-12", "2024-02", "2025-11", 175.0, 265.0, 250.0, 22);

        seedMedicineIfAbsent("Glycomet-GP 2", "Glimepiride (2mg) + Metformin Hydrochloride (500mg)", "Tablet",
                "USV Private Limited", "30049099", 12, "15 Tablets/Strip", 15, "Tab", "Rack C-04",
                true, false, false, 30, 60, "GLY-331", "2024-02", "2025-11", 160.0, 235.0, 225.0, 5);

        seedMedicineIfAbsent("Shelcal 500", "Calcium (500mg) + Vitamin D3 (250 IU)", "Tablet",
                "Torrent Pharmaceuticals Ltd", "30045090", 12, "15 Tablets/Strip", 15, "Tab", "Rack D-01",
                false, false, false, 35, 70, "SHL-902", "2024-01", "2026-06", 92.0, 131.0, 125.0, 65);

        seedMedicineIfAbsent("Ascoril D Plus Syrup", "Dextromethorphan + Phenylephrine + Chlorpheniramine", "Syrup",
                "Glenmark Pharmaceuticals Ltd", "30049080", 12, "100ml Bottle", 1, "Bottle", "Rack S-02",
                false, false, false, 20, 40, "ASC-512", "2024-03", "2026-02", 90.0, 135.0, 130.0, 18);

        seedMedicineIfAbsent("Lantus SoloStar Pen", "Insulin Glargine (100IU/ml)", "Injection",
                "Sanofi India Ltd", "30043110", 5, "3ml Cartridge Pen", 1, "Pen", "Cold Storage Chiller-1",
                true, false, false, 10, 20, "LAN-554", "2024-04", "2025-07", 580.0, 775.0, 750.0, 4);

        seedMedicineIfAbsent("Montair-LC", "Montelukast (10mg) + Levocetirizine (5mg)", "Tablet",
                "Cipla Ltd", "30049099", 12, "10 Tablets/Strip", 10, "Tab", "Rack A-06",
                true, false, false, 25, 50, "MNT-109", "2024-03", "2026-01", 140.0, 215.0, 205.0, 31);

        seedMedicineIfAbsent("Combiflam", "Ibuprofen (400mg) + Paracetamol (325mg)", "Tablet",
                "Sanofi India Ltd", "30049060", 12, "20 Tablets/Strip", 20, "Tab", "Rack A-07",
                false, false, false, 40, 100, "CMB-671", "2024-01", "2026-05", 32.0, 47.0, 45.0, 90);

        seedMedicineIfAbsent("Becosules Z", "Vitamin B-Complex with Zinc & Vitamin C", "Capsule",
                "Pfizer Limited", "30045090", 12, "20 Capsules/Strip", 20, "Cap", "Rack D-03",
                false, false, false, 30, 60, "BCZ-332", "2024-02", "2026-04", 38.0, 52.0, 48.0, 45);

        seedMedicineIfAbsent("Volini Gel", "Diclofenac Diethylamine + Linseed Oil + Menthol", "Ointment",
                "Sun Pharmaceutical Industries Ltd", "30049099", 12, "30g Tube", 1, "Tube", "Rack O-01",
                false, false, false, 20, 40, "VOL-819", "2024-03", "2026-08", 95.0, 145.0, 138.0, 28);

        seedMedicineIfAbsent("Asthalin Inhaler", "Salbutamol Inhalation Aerosol (100mcg)", "Inhaler",
                "Cipla Ltd", "30049099", 12, "200 Metered Doses", 1, "Canister", "Rack I-01",
                true, false, false, 15, 30, "AST-441", "2024-04", "2025-10", 110.0, 165.0, 155.0, 12);

        // ==========================================
        // 5. Seed Invoices (Initial Sales History)
        // ==========================================
        if (invoiceRepository.count() == 0) {
            seedSampleInvoices();
        }

        // ==========================================
        // 6. Seed Store Orders (Doctor & Customer Prescriptions)
        // ==========================================
        if (storeOrderRepository.count() == 0) {
            seedSampleOrders();
        }

        // ==========================================
        // 7. Seed Store Affiliations (Doctors & Customers linked to Stores)
        // ==========================================
        if (storeAffiliationRepository.count() == 0) {
            seedAffiliations();
        }

        // ==========================================
        // 8. Seed Initial Store History Logs
        // ==========================================
        if (storeHistoryLogRepository.count() == 0) {
            seedHistoryLogs();
        }

        log.info("Database seeding finished successfully! Total Users: {}, Medicines: {}, Stores: {}, Suppliers: {}, Invoices: {}, Orders: {}, Affiliations: {}, HistoryLogs: {}",
                userRepository.count(), medicineRepository.count(), partnerStoreRepository.count(),
                supplierRepository.count(), invoiceRepository.count(), storeOrderRepository.count(),
                storeAffiliationRepository.count(), storeHistoryLogRepository.count());
    }

    private void createUserIfAbsent(String name, String email, String password, String role,
                                   String phone, String avatar, Long storeId, String storeName,
                                   String doctorReg, String doctorSpec, String clinicAddr, String custAddr) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = User.builder()
                    .name(name)
                    .email(email)
                    .password(password)
                    .role(role)
                    .phone(phone)
                    .avatarIcon(avatar)
                    .storeId(storeId)
                    .storeName(storeName)
                    .doctorRegNo(doctorReg)
                    .doctorSpecialty(doctorSpec)
                    .clinicAddress(clinicAddr)
                    .customerAddress(custAddr)
                    .build();
            userRepository.save(user);
        }
    }

    private void seedMedicineIfAbsent(String brand, String generic, String category, String manufacturer,
                                     String hsn, int gst, String pack, int units, String unitLabel, String rack,
                                     boolean schedH, boolean schedH1, boolean narcotic, int reorder, int defaultQty,
                                     String batchNo, String mfg, String exp, double cost, double mrp, double sale, int stock) {
        if (medicineRepository.findByBrandName(brand).isEmpty()) {
            Medicine med = Medicine.builder()
                    .brandName(brand)
                    .genericName(generic)
                    .category(category)
                    .manufacturer(manufacturer)
                    .hsnCode(hsn)
                    .gstRate(gst)
                    .packaging(pack)
                    .unitsPerPack(units)
                    .unitLabel(unitLabel)
                    .rackLocation(rack)
                    .isScheduleH(schedH)
                    .isScheduleH1(schedH1)
                    .isNarcotic(narcotic)
                    .reorderLevel(reorder)
                    .defaultReorderQty(defaultQty)
                    .build();

            Medicine saved = medicineRepository.save(med);

            Batch b = Batch.builder()
                    .batchNumber(batchNo)
                    .mfgDate(mfg)
                    .expiryDate(exp)
                    .purchasePrice(cost)
                    .mrp(mrp)
                    .salePrice(sale)
                    .stockPacks(stock)
                    .medicine(saved)
                    .build();

            batchRepository.save(b);
        }
    }

    private void seedSampleInvoices() {
        Medicine dolo = medicineRepository.findByBrandName("Dolo 650").orElse(null);
        Medicine pan = medicineRepository.findByBrandName("Pan 40").orElse(null);
        if (dolo == null || pan == null) return;

        Batch doloBatch = batchRepository.findByMedicineId(dolo.getId()).stream().findFirst().orElse(null);
        Batch panBatch = batchRepository.findByMedicineId(pan.getId()).stream().findFirst().orElse(null);
        if (doloBatch == null || panBatch == null) return;

        InvoiceItem item1 = InvoiceItem.builder()
                .medicineId(dolo.getId())
                .medicineName(dolo.getBrandName())
                .genericName(dolo.getGenericName())
                .batchNumber(doloBatch.getBatchNumber())
                .expiryDate(doloBatch.getExpiryDate())
                .hsnCode(dolo.getHsnCode())
                .saleType("FULL_PACK")
                .quantity(2)
                .unitPrice(doloBatch.getSalePrice())
                .mrp(doloBatch.getMrp())
                .costPrice(doloBatch.getPurchasePrice())
                .discountPercent(5.0)
                .gstRate(dolo.getGstRate())
                .taxAmount(6.51)
                .subtotal(60.80)
                .total(67.31)
                .build();

        InvoiceItem item2 = InvoiceItem.builder()
                .medicineId(pan.getId())
                .medicineName(pan.getBrandName())
                .genericName(pan.getGenericName())
                .batchNumber(panBatch.getBatchNumber())
                .expiryDate(panBatch.getExpiryDate())
                .hsnCode(pan.getHsnCode())
                .saleType("FULL_PACK")
                .quantity(1)
                .unitPrice(panBatch.getSalePrice())
                .mrp(panBatch.getMrp())
                .costPrice(panBatch.getPurchasePrice())
                .discountPercent(0.0)
                .gstRate(pan.getGstRate())
                .taxAmount(18.0)
                .subtotal(150.0)
                .total(168.0)
                .build();

        Invoice inv1 = Invoice.builder()
                .invoiceNumber("INV-2025-0001")
                .timestamp(LocalDateTime.now().minusDays(1))
                .customerName("Vikram Malhotra")
                .customerPhone("+91 98199 44332")
                .doctorName("Dr. Sneha Roy")
                .doctorRegNo("MMC-2016-89421")
                .subtotal(210.80)
                .totalDiscount(3.20)
                .cgst(12.25)
                .sgst(12.25)
                .totalTax(24.51)
                .roundOff(0.69)
                .grandTotal(236.00)
                .totalCostPrice(155.00)
                .grossProfit(81.00)
                .paymentMode("UPI")
                .paymentStatus("PAID")
                .hasScheduleH(true)
                .dispensedBy("Counter 1")
                .items(new ArrayList<>(List.of(item1, item2)))
                .build();

        invoiceRepository.save(inv1);
    }

    private void seedSampleOrders() {
        User doctor = userRepository.findByEmail("dr.sneha@clinic.org").orElse(null);
        PartnerStore store = partnerStoreRepository.findAll().stream().findFirst().orElse(null);
        if (doctor == null || store == null) return;

        Medicine telma = medicineRepository.findByBrandName("Telma 40").orElse(null);
        Medicine gly = medicineRepository.findByBrandName("Glycomet-GP 2").orElse(null);
        if (telma == null || gly == null) return;

        OrderItem oi1 = OrderItem.builder()
                .medicineId(telma.getId())
                .medicineName(telma.getBrandName())
                .genericName(telma.getGenericName())
                .packaging(telma.getPackaging())
                .quantity(2)
                .unitPrice(210.0)
                .total(420.0)
                .dosage("1-0-0")
                .timing("Morning after breakfast")
                .durationDays(30)
                .build();

        OrderItem oi2 = OrderItem.builder()
                .medicineId(gly.getId())
                .medicineName(gly.getBrandName())
                .genericName(gly.getGenericName())
                .packaging(gly.getPackaging())
                .quantity(2)
                .unitPrice(225.0)
                .total(450.0)
                .dosage("1-0-1")
                .timing("Before meals with water")
                .durationDays(30)
                .build();

        StoreOrder ord = StoreOrder.builder()
                .orderNumber("ORD-2025-0101")
                .orderType("DOCTOR_PRESCRIPTION")
                .storeId(store.getId())
                .storeName(store.getName())
                .placedByUserId(doctor.getId())
                .placedByUserName(doctor.getName())
                .placedByUserRole(doctor.getRole())
                .placedByUserPhone(doctor.getPhone())
                .doctorRegNo(doctor.getDoctorRegNo())
                .doctorSpecialty(doctor.getDoctorSpecialty())
                .createdAt(LocalDateTime.now())
                .patientName("Rameshwar Sharma")
                .patientAge(54)
                .patientGender("Male")
                .patientPhone("+91 98334 11223")
                .diagnosis("Type 2 Diabetes Mellitus with Essential Hypertension")
                .prescriptionNotes("Patient advised low sodium diet. Review HbA1c in 3 months.")
                .deliveryAddress("Home Delivery to Patient: 102/B, Sai Krupa CHS, Tilak Nagar, Mumbai")
                .paymentMethod("COD")
                .paymentStatus("PENDING_COLLECTION")
                .orderStatus("NEW_RECEIVED")
                .totalAmount(870.0)
                .items(new ArrayList<>(List.of(oi1, oi2)))
                .build();

        storeOrderRepository.save(ord);
    }

    private void seedAffiliations() {
        // Store 1 (MediCare Pharmacy)
        affiliateUserIfAbsent(1L, "dr.sneha@clinic.org", "DOCTOR", "Rajesh Patel", "Primary Partner Prescribing Doctor");
        affiliateUserIfAbsent(1L, "vikram.m@gmail.com", "CUSTOMER", "Rajesh Patel", "Regular Khata Credit Customer");
        affiliateUserIfAbsent(1L, "sunita.sharma@yahoo.co.in", "CUSTOMER", "Rajesh Patel", "Senior Citizen Healthcare Member");

        // Store 2 (HealthFirst Chemist)
        affiliateUserIfAbsent(2L, "dr.priya@childhealth.org", "DOCTOR", "Amit Shah", "Consultant Pediatrician Partner");
        affiliateUserIfAbsent(2L, "rahul.verma@gmail.com", "CUSTOMER", "Amit Shah", "Chronic Diabetes Refill Customer");

        // Store 3 (Apex LifeLine)
        affiliateUserIfAbsent(3L, "dr.sharma@heartcare.org", "DOCTOR", "Suresh Deshmukh", "Cardiology Clinic Referral Partner");
        affiliateUserIfAbsent(3L, "ananya.iyer@outlook.com", "CUSTOMER", "Suresh Deshmukh", "Corporate Health Plan Client");
        affiliateUserIfAbsent(3L, "deepak.k@gmail.com", "CUSTOMER", "Suresh Deshmukh", "Thane West Local Resident");
    }

    private void affiliateUserIfAbsent(Long storeId, String email, String role, String addedBy, String notes) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (!storeAffiliationRepository.existsByStoreIdAndUserId(storeId, user.getId())) {
                StoreAffiliation aff = StoreAffiliation.builder()
                        .storeId(storeId)
                        .userId(user.getId())
                        .role(role)
                        .createdAt(LocalDateTime.now().minusDays(3))
                        .addedBy(addedBy)
                        .notes(notes)
                        .build();
                storeAffiliationRepository.save(aff);
            }
        });
    }

    private void seedHistoryLogs() {
        LocalDateTime now = LocalDateTime.now();

        List<StoreHistoryLog> logs = List.of(
                StoreHistoryLog.builder()
                        .storeId(1L)
                        .timestamp(now.minusDays(5))
                        .eventType("INVENTORY_CHANGE")
                        .title("Store Catalog Initialized")
                        .description("Inwarded 16 pharmaceutical formulations with initial FEFO batches.")
                        .performedBy("Rajesh Patel (Store Owner)")
                        .referenceId("BATCH-INIT")
                        .amount(48500.0)
                        .build(),
                StoreHistoryLog.builder()
                        .storeId(1L)
                        .timestamp(now.minusDays(4))
                        .eventType("DOCTOR_ADDED")
                        .title("Partner Doctor Affiliated: Dr. Sneha Roy")
                        .description("Dr. Sneha Roy, MBBS, MD (Reg: MMC-2016-89421) registered and connected to store.")
                        .performedBy("Rajesh Patel (Store Owner)")
                        .referenceId("DOC-101")
                        .build(),
                StoreHistoryLog.builder()
                        .storeId(1L)
                        .timestamp(now.minusDays(3))
                        .eventType("CUSTOMER_ADDED")
                        .title("Customer Registered: Vikram Malhotra")
                        .description("Customer Vikram Malhotra (+91 98199 44332) registered for Khata credit billing.")
                        .performedBy("Rajesh Patel (Store Owner)")
                        .referenceId("CUST-201")
                        .build(),
                StoreHistoryLog.builder()
                        .storeId(1L)
                        .timestamp(now.minusDays(2))
                        .eventType("ORDER_RECEIVED")
                        .title("Doctor Prescription Received: ORD-2025-0101")
                        .description("E-prescription received from Dr. Sneha Roy for patient Rameshwar Sharma (Total: ₹870.00).")
                        .performedBy("Dr. Sneha Roy")
                        .referenceId("ORD-2025-0101")
                        .amount(870.0)
                        .build(),
                StoreHistoryLog.builder()
                        .storeId(1L)
                        .timestamp(now.minusDays(1))
                        .eventType("SALE_BILLING")
                        .title("Counter POS Bill: INV-2025-0001")
                        .description("Cashier POS checkout completed for Vikram Malhotra (₹236.00, UPI).")
                        .performedBy("Counter 1")
                        .referenceId("INV-2025-0001")
                        .amount(236.0)
                        .build()
        );

        storeHistoryLogRepository.saveAll(logs);
    }
}
