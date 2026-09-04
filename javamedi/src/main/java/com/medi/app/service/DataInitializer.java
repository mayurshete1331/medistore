package com.medi.app.service;

import com.medi.app.entity.*;
import com.medi.app.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already initialized with data. Skipping seed.");
            return;
        }

        log.info("Seeding MySQL database with initial Medi platform data...");

        // 1. Seed Users
        User owner = User.builder()
                .name("Rajesh Patel")
                .email("owner@medicare.com")
                .role("STORE_OWNER")
                .phone("+91 98765 43210")
                .avatarIcon("🏪")
                .storeId(1L)
                .storeName("MediCare Pharmacy & SuperStore (Main Branch)")
                .build();

        User doctor = User.builder()
                .name("Dr. Sneha Roy, MBBS, MD")
                .email("dr.sneha@clinic.org")
                .role("DOCTOR")
                .phone("+91 98201 88990")
                .avatarIcon("🩺")
                .doctorRegNo("MMC-2016-89421")
                .doctorSpecialty("Internal Medicine & Chronic Care")
                .clinicAddress("Roy Medical Chambers, Suite 204, Mumbai")
                .build();

        User customer = User.builder()
                .name("Vikram Malhotra")
                .email("vikram.m@gmail.com")
                .role("CUSTOMER")
                .phone("+91 98199 44332")
                .avatarIcon("👤")
                .customerAddress("Flat 402, Green Meadows Tower, Link Road, Andheri West, Mumbai 400053")
                .build();

        userRepository.saveAll(List.of(owner, doctor, customer));

        // 2. Seed Partner Stores
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

        // 3. Seed Suppliers
        Supplier sup1 = Supplier.builder()
                .name("Apollo MedSolutions & Distributors")
                .contactPerson("Ramesh Patel")
                .phone("+91 98765 43210")
                .whatsappNumber("+919876543210")
                .email("orders@apollomedsolutions.com")
                .gstin("27AABCA1234F1Z8")
                .drugLicenseNo("MH-MZ4-20B-10928")
                .address("Plot 42, Pharma Zone, MIDC, Mumbai 400093")
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

        supplierRepository.saveAll(List.of(sup1, sup2));

        // 4. Seed Medicines & Batches
        seedMedicine("Augmentin 625 Duo", "Amoxicillin (500mg) + Clavulanic Acid (125mg)", "Tablet",
                "GlaxoSmithKline", "30041010", 12, "10 Tablets/Strip", 10, "Tab", "Rack A-01",
                true, false, false, 25, 50, "AUG2408", "2024-02", "2025-08", 145.0, 201.71, 195.0, 14);

        seedMedicine("Dolo 650", "Paracetamol (650mg)", "Tablet",
                "Micro Labs Ltd", "30049060", 12, "15 Tablets/Strip", 15, "Tab", "Rack A-02",
                false, false, false, 40, 100, "DL65-11", "2024-04", "2026-03", 22.5, 33.60, 32.0, 85);

        seedMedicine("Pan 40", "Pantoprazole (40mg)", "Tablet",
                "Alkem Laboratories Ltd", "30049099", 12, "15 Tablets/Strip", 15, "Tab", "Rack B-03",
                true, false, false, 30, 60, "PAN4-90", "2024-01", "2025-12", 110.0, 155.0, 150.0, 52);

        seedMedicine("Azithral 500", "Azithromycin (500mg)", "Tablet",
                "Alembic Pharmaceuticals Ltd", "30042010", 12, "5 Tablets/Strip", 5, "Tab", "Rack A-05",
                true, true, false, 20, 40, "AZT-220", "2024-03", "2025-09", 85.0, 132.0, 128.0, 8);

        seedMedicine("Telma 40", "Telmisartan (40mg)", "Tablet",
                "Glenmark Pharmaceuticals Ltd", "30049099", 12, "15 Tablets/Strip", 15, "Tab", "Rack C-01",
                true, false, false, 25, 50, "TLM-789", "2024-05", "2026-04", 150.0, 220.0, 210.0, 42);

        seedMedicine("Glycomet-GP 2", "Glimepiride (2mg) + Metformin (500mg)", "Tablet",
                "USV Ltd", "30049099", 12, "15 Tablets/Strip", 15, "Tab", "Rack C-04",
                true, false, false, 30, 60, "GLY-331", "2024-02", "2025-11", 160.0, 235.0, 225.0, 5);

        seedMedicine("Ascoril D Plus Syrup", "Dextromethorphan + Phenylephrine + Chlorpheniramine", "Syrup",
                "Glenmark Pharmaceuticals Ltd", "30049099", 12, "100ml Bottle", 1, "Bottle", "Rack S-02",
                true, false, false, 20, 40, "ASC-512", "2024-03", "2026-02", 90.0, 135.0, 130.0, 18);

        seedMedicine("Lantus SoloStar Pen", "Insulin Glargine (100IU/ml)", "Injection",
                "Sanofi India Ltd", "30043110", 5, "3ml Cartridge Pen", 1, "Pen", "Cold Storage Chiller-1",
                true, false, false, 10, 20, "LAN-554", "2024-04", "2025-07", 580.0, 775.0, 750.0, 4);

        log.info("Database seeding complete! Total medicines: {}", medicineRepository.count());
    }

    private void seedMedicine(String brand, String generic, String category, String manufacturer,
                              String hsn, int gst, String pack, int units, String unitLabel, String rack,
                              boolean schedH, boolean schedH1, boolean narcotic, int reorder, int defaultQty,
                              String batchNo, String mfg, String exp, double cost, double mrp, double sale, int stock) {
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
