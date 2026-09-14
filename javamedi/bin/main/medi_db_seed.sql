-- ============================================================================
-- MediStore Pharma ERP & POS Platform - MySQL Database Seed Script
-- Database: medi_db
-- Run this script in MySQL Workbench, DBeaver, or via mysql CLI:
-- mysql -u root -p medi_db < medi_db_seed.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `medi_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `medi_db`;

-- Disable Foreign Key Checks during import
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. PARTNER STORES (3 Stores)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `partner_stores`;
CREATE TABLE `partner_stores` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `dl_number` VARCHAR(255) DEFAULT NULL,
  `gstin` VARCHAR(255) DEFAULT NULL,
  `distance` VARCHAR(255) DEFAULT NULL,
  `rating` DOUBLE DEFAULT 4.8,
  `is_open` BIT(1) DEFAULT b'1',
  `delivery_available` BIT(1) DEFAULT b'1',
  `cod_available` BIT(1) DEFAULT b'1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `partner_stores` (`id`, `name`, `address`, `phone`, `email`, `dl_number`, `gstin`, `distance`, `rating`, `is_open`, `delivery_available`, `cod_available`) VALUES
(1, 'MediCare Pharmacy & SuperStore (Main Branch)', 'Shop 4 & 5, Health Square, Medical Zone, Mumbai 400012', '+91 98765 43210', 'orders@medicare.com', '20B/MH-MZ4-10928, 21B/MH-MZ4-10929', '27AABCM1122D1Z9', '0.4 km', 4.9, b'1', b'1', b'1'),
(2, 'HealthFirst 24x7 Chemist & Druggists', 'Near Ruby Hall Clinic, Shivaji Nagar, Pune 411005', '+91 91234 56789', 'pune@healthfirst.in', '20B/MH-PUN-34190, 21B/MH-PUN-34191', '27AABCH9988C1Z4', '1.8 km', 4.7, b'1', b'1', b'1'),
(3, 'Apex LifeLine Pharmacy & Surgical Store', 'G-12, Highland Complex, Majiwada, Thane West 400601', '+91 99887 76655', 'care@apexlifeline.com', '20B/MH-THN-88120, 21B/MH-THN-88121', '27AABCA7766K1Z1', '3.2 km', 4.8, b'1', b'1', b'1');

-- ----------------------------------------------------------------------------
-- 2. USERS (3 Owners, 3 Doctors, 5 Customers)
-- Password for all accounts is '123456' (BCrypt Encoded)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) DEFAULT NULL,
  `avatar_icon` VARCHAR(255) DEFAULT NULL,
  `doctor_reg_no` VARCHAR(255) DEFAULT NULL,
  `doctor_specialty` VARCHAR(255) DEFAULT NULL,
  `clinic_address` VARCHAR(255) DEFAULT NULL,
  `customer_address` VARCHAR(255) DEFAULT NULL,
  `store_id` BIGINT DEFAULT NULL,
  `store_name` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BCrypt hash for '123456' is $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `avatar_icon`, `store_id`, `store_name`, `doctor_reg_no`, `doctor_specialty`, `clinic_address`, `customer_address`) VALUES
-- 3 Store Owners
(1, 'Rajesh Patel', 'owner@medicare.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'STORE_OWNER', '+91 98765 43210', '🏪', 1, 'MediCare Pharmacy & SuperStore (Main Branch)', NULL, NULL, NULL, NULL),
(2, 'Amit Shah', 'amit.owner@healthfirst.in', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'STORE_OWNER', '+91 91234 56780', '🏥', 2, 'HealthFirst 24x7 Chemist & Druggists', NULL, NULL, NULL, NULL),
(3, 'Suresh Deshmukh', 'suresh.owner@apexlifeline.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'STORE_OWNER', '+91 99887 76650', '🏬', 3, 'Apex LifeLine Pharmacy & Surgical Store', NULL, NULL, NULL, NULL),

-- 3 Doctors
(4, 'Dr. Sneha Roy, MBBS, MD', 'dr.sneha@clinic.org', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'DOCTOR', '+91 98201 88990', '🩺', NULL, NULL, 'MMC-2016-89421', 'Internal Medicine & Chronic Care', 'Roy Medical Chambers, Suite 204, Mumbai', NULL),
(5, 'Dr. Rajesh Sharma, MD (Cardiology)', 'dr.sharma@heartcare.org', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'DOCTOR', '+91 98203 11229', '❤️‍🩹', NULL, NULL, 'MMC-2012-45211', 'Cardiologist & Hypertension Specialist', 'Apex Heart Institute, Sector 15, Thane', NULL),
(6, 'Dr. Priya Patel, MBBS, DCH', 'dr.priya@childhealth.org', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'DOCTOR', '+91 98111 22334', '👶', NULL, NULL, 'MMC-2018-77123', 'Consultant Pediatrician & Neonatologist', 'Little Stars Children Clinic, Kothrud, Pune', NULL),

-- 5 Customers
(7, 'Vikram Malhotra', 'vikram.m@gmail.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'CUSTOMER', '+91 98199 44332', '👤', NULL, NULL, NULL, NULL, NULL, 'Flat 402, Green Meadows Tower, Link Road, Andheri West, Mumbai 400053'),
(8, 'Sunita Sharma', 'sunita.sharma@yahoo.co.in', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'CUSTOMER', '+91 98202 55661', '👩', NULL, NULL, NULL, NULL, NULL, 'B-14, Shanti Niketan CHS, S.V. Road, Borivali West, Mumbai 400092'),
(9, 'Rahul Verma', 'rahul.verma@gmail.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'CUSTOMER', '+91 98333 11224', '👨', NULL, NULL, NULL, NULL, NULL, 'Row House 7, Silver Oak Enclave, Paud Road, Kothrud, Pune 411038'),
(10, 'Ananya Iyer', 'ananya.iyer@outlook.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'CUSTOMER', '+91 98444 66778', '👩‍💼', NULL, NULL, NULL, NULL, NULL, 'A-501, Palm Beach Residency, Sector 19D, Vashi, Navi Mumbai 400703'),
(11, 'Deepak Kulkarni', 'deepak.k@gmail.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'CUSTOMER', '+91 98555 99880', '👨‍💼', NULL, NULL, NULL, NULL, NULL, 'Flat 303, Highland Park, Pokhran Road No. 2, Thane West 400610');

-- ----------------------------------------------------------------------------
-- 3. SUPPLIERS (3 Pharma Distributors)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `contact_person` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(255) DEFAULT NULL,
  `whatsapp_number` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `gstin` VARCHAR(255) DEFAULT NULL,
  `drug_license_no` VARCHAR(255) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `phone`, `whatsapp_number`, `email`, `gstin`, `drug_license_no`, `address`) VALUES
(1, 'Apollo MedSolutions & Distributors', 'Ramesh Patel', '+91 98765 43210', '+919876543210', 'orders@apollomedsolutions.com', '27AABCA1234F1Z8', 'MH-MZ4-20B-10928', 'Plot 42, Pharma Zone, MIDC Industrial Area, Mumbai 400093'),
(2, 'MediLife Pharma Distributors', 'Sanjay Sharma', '+91 91234 56789', '+919123456789', 'supply@medilifepharma.in', '27AABCM9876E1Z5', 'MH-PUN-21B-45812', 'Shop 12-14, Laxmi Market, Drug Quarter, Pune 411002'),
(3, 'Sunrise Care & Surgical Supplies', 'Dr. Vivek Verma', '+91 99887 76655', '+919988776655', 'care@sunrisesurgicals.com', '27AABCS5544G1Z2', 'MH-THN-20B-78321', 'B-7, Logistics Hub, Bhiwandi, Thane 421302');

-- ----------------------------------------------------------------------------
-- 4. MEDICINES (Including Telmikaa AMH, Telma-H, Telma 40, Augmentin, etc.)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `medicines`;
CREATE TABLE `medicines` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `brand_name` VARCHAR(255) NOT NULL,
  `generic_name` VARCHAR(500) NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `manufacturer` VARCHAR(255) DEFAULT NULL,
  `hsn_code` VARCHAR(255) DEFAULT NULL,
  `gst_rate` INT DEFAULT 12,
  `packaging` VARCHAR(255) DEFAULT NULL,
  `units_per_pack` INT DEFAULT 10,
  `unit_label` VARCHAR(255) DEFAULT 'Tab',
  `rack_location` VARCHAR(255) DEFAULT 'Rack A-01',
  `is_scheduleh` BIT(1) DEFAULT b'0',
  `is_scheduleh1` BIT(1) DEFAULT b'0',
  `is_narcotic` BIT(1) DEFAULT b'0',
  `reorder_level` INT DEFAULT 20,
  `default_reorder_qty` INT DEFAULT 50,
  `barcode` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `medicines` (`id`, `brand_name`, `generic_name`, `category`, `manufacturer`, `hsn_code`, `gst_rate`, `packaging`, `units_per_pack`, `unit_label`, `rack_location`, `is_scheduleh`, `is_scheduleh1`, `is_narcotic`, `reorder_level`, `default_reorder_qty`, `barcode`) VALUES
(1, 'Augmentin 625 Duo', 'Amoxicillin (500mg) + Clavulanic Acid (125mg)', 'Tablet', 'GlaxoSmithKline Pharmaceuticals', '30041010', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack A-01', b'1', b'0', b'0', 25, 50, '890111700101'),
(2, 'Dolo 650', 'Paracetamol (650mg)', 'Tablet', 'Micro Labs Ltd', '30049060', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack A-02', b'0', b'0', b'0', 40, 100, '890111700102'),
(3, 'Pan 40', 'Pantoprazole Gastro-resistant (40mg)', 'Tablet', 'Alkem Laboratories Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack B-03', b'1', b'0', b'0', 30, 60, '890111700103'),
(4, 'Pan-D', 'Pantoprazole (40mg) + Domperidone SR (30mg)', 'Capsule', 'Alkem Laboratories Ltd', '30049099', 12, '15 Capsules/Strip', 15, 'Cap', 'Rack B-04', b'1', b'0', b'0', 30, 60, NULL),
(5, 'Azithral 500', 'Azithromycin (500mg)', 'Tablet', 'Alembic Pharmaceuticals Ltd', '30042010', 12, '5 Tablets/Strip', 5, 'Tab', 'Rack A-05', b'1', b'1', b'0', 20, 40, '890111700104'),
(6, 'Telma 40', 'Telmisartan (40mg)', 'Tablet', 'Glenmark Pharmaceuticals Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-01', b'1', b'0', b'0', 25, 50, '890111700105'),
(7, 'Telma-H', 'Telmisartan (40mg) + Hydrochlorothiazide (12.5mg)', 'Tablet', 'Glenmark Pharmaceuticals Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-02', b'1', b'0', b'0', 20, 40, NULL),
(8, 'Telmikaa AMH', 'Telmisartan (40mg) + Amlodipine (5mg) + Hydrochlorothiazide (12.5mg)', 'Tablet', 'Mankind Pharma Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack C-03', b'1', b'0', b'0', 25, 50, '890111700125'),
(9, 'Telma AMH', 'Telmisartan (40mg) + Amlodipine (5mg) + Hydrochlorothiazide (12.5mg)', 'Tablet', 'Glenmark Pharmaceuticals Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack C-04', b'1', b'0', b'0', 25, 50, '890111700126'),
(10, 'Glycomet-GP 2', 'Glimepiride (2mg) + Metformin Hydrochloride (500mg)', 'Tablet', 'USV Private Limited', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-05', b'1', b'0', b'0', 30, 60, NULL),
(11, 'Shelcal 500', 'Calcium (500mg) + Vitamin D3 (250 IU)', 'Tablet', 'Torrent Pharmaceuticals Ltd', '30045090', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack D-01', b'0', b'0', b'0', 35, 70, NULL),
(12, 'Ascoril D Plus Syrup', 'Dextromethorphan + Phenylephrine + Chlorpheniramine', 'Syrup', 'Glenmark Pharmaceuticals Ltd', '30049080', 12, '100ml Bottle', 1, 'Bottle', 'Rack S-02', b'0', b'0', b'0', 20, 40, NULL),
(13, 'Lantus SoloStar Pen', 'Insulin Glargine (100IU/ml)', 'Injection', 'Sanofi India Ltd', '30043110', 5, '3ml Cartridge Pen', 1, 'Pen', 'Cold Storage Chiller-1', b'1', b'0', b'0', 10, 20, NULL),
(14, 'Montair-LC', 'Montelukast (10mg) + Levocetirizine (5mg)', 'Tablet', 'Cipla Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack A-06', b'1', b'0', b'0', 25, 50, NULL),
(15, 'Combiflam', 'Ibuprofen (400mg) + Paracetamol (325mg)', 'Tablet', 'Sanofi India Ltd', '30049060', 12, '20 Tablets/Strip', 20, 'Tab', 'Rack A-07', b'0', b'0', b'0', 40, 100, NULL),
(16, 'Becosules Z', 'Vitamin B-Complex with Zinc & Vitamin C', 'Capsule', 'Pfizer Limited', '30045090', 12, '20 Capsules/Strip', 20, 'Cap', 'Rack D-03', b'0', b'0', b'0', 30, 60, NULL),
(17, 'Volini Gel', 'Diclofenac Diethylamine + Linseed Oil + Menthol', 'Ointment', 'Sun Pharmaceutical Industries Ltd', '30049099', 12, '30g Tube', 1, 'Tube', 'Rack O-01', b'0', b'0', b'0', 20, 40, NULL),
(18, 'Asthalin Inhaler', 'Salbutamol Inhalation Aerosol (100mcg)', 'Inhaler', 'Cipla Ltd', '30049099', 12, '200 Metered Doses', 1, 'Canister', 'Rack I-01', b'1', b'0', b'0', 15, 30, NULL);

-- ----------------------------------------------------------------------------
-- 5. BATCHES (Stock, FEFO Expiry, Pricing)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `batches`;
CREATE TABLE `batches` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `batch_number` VARCHAR(255) NOT NULL,
  `mfg_date` VARCHAR(255) NOT NULL,
  `expiry_date` VARCHAR(255) NOT NULL,
  `purchase_price` DOUBLE NOT NULL,
  `mrp` DOUBLE NOT NULL,
  `sale_price` DOUBLE NOT NULL,
  `stock_packs` INT NOT NULL,
  `medicine_id` BIGINT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_batches_medicine` (`medicine_id`),
  CONSTRAINT `fk_batches_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `batches` (`id`, `batch_number`, `mfg_date`, `expiry_date`, `purchase_price`, `mrp`, `sale_price`, `stock_packs`, `medicine_id`) VALUES
(1, 'AUG2408', '2024-02', '2025-08', 145.00, 201.71, 195.00, 14, 1),
(2, 'DL65-11', '2024-04', '2026-03', 22.50, 33.60, 32.00, 85, 2),
(3, 'PAN4-90', '2024-01', '2025-12', 110.00, 155.00, 150.00, 52, 3),
(4, 'PAND-44', '2024-03', '2025-10', 135.00, 199.00, 190.00, 38, 4),
(5, 'AZT-220', '2024-03', '2025-09', 85.00, 132.00, 128.00, 8, 5),
(6, 'TLM-789', '2024-05', '2026-04', 150.00, 220.00, 210.00, 42, 6),
(7, 'TLMH-12', '2024-02', '2025-11', 175.00, 265.00, 250.00, 22, 7),
(8, 'TLM-AMH-01', '2024-04', '2026-03', 110.00, 165.00, 155.00, 35, 8),
(9, 'TLM-AMH-GLN', '2024-05', '2026-05', 120.00, 180.00, 170.00, 40, 9),
(10, 'GLY-331', '2024-02', '2025-11', 160.00, 235.00, 225.00, 5, 10),
(11, 'SHL-902', '2024-01', '2026-06', 92.00, 131.00, 125.00, 65, 11),
(12, 'ASC-512', '2024-03', '2026-02', 90.00, 135.00, 130.00, 18, 12),
(13, 'LAN-554', '2024-04', '2025-07', 580.00, 775.00, 750.00, 4, 13),
(14, 'MNT-109', '2024-03', '2026-01', 140.00, 215.00, 205.00, 31, 14),
(15, 'CMB-671', '2024-01', '2026-05', 32.00, 47.00, 45.00, 90, 15),
(16, 'BCZ-332', '2024-02', '2026-04', 38.00, 52.00, 48.00, 45, 16),
(17, 'VOL-819', '2024-03', '2026-08', 95.00, 145.00, 138.00, 28, 17),
(18, 'AST-441', '2024-04', '2025-10', 110.00, 165.00, 155.00, 12, 18);

-- ----------------------------------------------------------------------------
-- 6. STORE AFFILIATIONS (Doctors & Customers linked to Stores)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `store_affiliations`;
CREATE TABLE `store_affiliations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `store_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `added_by` VARCHAR(255) DEFAULT NULL,
  `notes` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_store_user` (`store_id`, `user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `store_affiliations` (`id`, `store_id`, `user_id`, `role`, `created_at`, `added_by`, `notes`) VALUES
(1, 1, 4, 'DOCTOR', NOW() - INTERVAL 5 DAY, 'Rajesh Patel', 'Primary Partner Prescribing Doctor'),
(2, 1, 7, 'CUSTOMER', NOW() - INTERVAL 4 DAY, 'Rajesh Patel', 'Regular Khata Credit Customer'),
(3, 1, 8, 'CUSTOMER', NOW() - INTERVAL 4 DAY, 'Rajesh Patel', 'Senior Citizen Healthcare Member'),
(4, 2, 6, 'DOCTOR', NOW() - INTERVAL 3 DAY, 'Amit Shah', 'Consultant Pediatrician Partner'),
(5, 2, 9, 'CUSTOMER', NOW() - INTERVAL 3 DAY, 'Amit Shah', 'Chronic Diabetes Refill Customer'),
(6, 3, 5, 'DOCTOR', NOW() - INTERVAL 2 DAY, 'Suresh Deshmukh', 'Cardiology Clinic Referral Partner'),
(7, 3, 10, 'CUSTOMER', NOW() - INTERVAL 2 DAY, 'Suresh Deshmukh', 'Corporate Health Plan Client'),
(8, 3, 11, 'CUSTOMER', NOW() - INTERVAL 1 DAY, 'Suresh Deshmukh', 'Thane West Local Resident');

-- ----------------------------------------------------------------------------
-- 7. STORE HISTORY LOGS (Audit Trail)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `store_history_logs`;
CREATE TABLE `store_history_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `store_id` BIGINT NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `event_type` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` VARCHAR(2000) DEFAULT NULL,
  `performed_by` VARCHAR(255) NOT NULL,
  `reference_id` VARCHAR(255) DEFAULT NULL,
  `amount` DOUBLE DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `store_history_logs` (`id`, `store_id`, `timestamp`, `event_type`, `title`, `description`, `performed_by`, `reference_id`, `amount`) VALUES
(1, 1, NOW() - INTERVAL 5 DAY, 'INVENTORY_CHANGE', 'Store Catalog Initialized', 'Inwarded 18 pharmaceutical formulations with initial FEFO batches including Telmikaa AMH.', 'Rajesh Patel (Store Owner)', 'BATCH-INIT', 52500.00),
(2, 1, NOW() - INTERVAL 4 DAY, 'DOCTOR_ADDED', 'Partner Doctor Affiliated: Dr. Sneha Roy', 'Dr. Sneha Roy, MBBS, MD (Reg: MMC-2016-89421) registered and connected to store.', 'Rajesh Patel (Store Owner)', 'DOC-101', NULL),
(3, 1, NOW() - INTERVAL 3 DAY, 'CUSTOMER_ADDED', 'Customer Registered: Vikram Malhotra', 'Customer Vikram Malhotra (+91 98199 44332) registered for Khata credit billing.', 'Rajesh Patel (Store Owner)', 'CUST-201', NULL),
(4, 1, NOW() - INTERVAL 2 DAY, 'ORDER_RECEIVED', 'Doctor Prescription Received: ORD-2025-0101', 'E-prescription received from Dr. Sneha Roy for patient Rameshwar Sharma (Total: ₹870.00).', 'Dr. Sneha Roy', 'ORD-2025-0101', 870.00),
(5, 1, NOW() - INTERVAL 1 DAY, 'SALE_BILLING', 'Counter POS Bill: INV-2025-0001', 'Cashier POS checkout completed for Vikram Malhotra (₹236.00, UPI).', 'Counter 1', 'INV-2025-0001', 236.00);

-- ----------------------------------------------------------------------------
-- 8. INVOICES & INVOICE ITEMS (Sales History)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `invoice_items`;
DROP TABLE IF EXISTS `invoices`;

CREATE TABLE `invoices` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `invoice_number` VARCHAR(255) NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `customer_name` VARCHAR(255) DEFAULT NULL,
  `customer_phone` VARCHAR(255) DEFAULT NULL,
  `doctor_name` VARCHAR(255) DEFAULT NULL,
  `doctor_reg_no` VARCHAR(255) DEFAULT NULL,
  `subtotal` DOUBLE NOT NULL,
  `total_discount` DOUBLE DEFAULT 0,
  `cgst` DOUBLE DEFAULT 0,
  `sgst` DOUBLE DEFAULT 0,
  `total_tax` DOUBLE DEFAULT 0,
  `round_off` DOUBLE DEFAULT 0,
  `grand_total` DOUBLE NOT NULL,
  `total_cost_price` DOUBLE DEFAULT 0,
  `gross_profit` DOUBLE DEFAULT 0,
  `payment_mode` VARCHAR(255) NOT NULL,
  `payment_status` VARCHAR(255) NOT NULL,
  `has_scheduleh` BIT(1) DEFAULT b'0',
  `dispensed_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invoice_number` (`invoice_number`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoice_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `invoice_id` BIGINT DEFAULT NULL,
  `medicine_id` BIGINT DEFAULT NULL,
  `medicine_name` VARCHAR(255) DEFAULT NULL,
  `generic_name` VARCHAR(255) DEFAULT NULL,
  `batch_number` VARCHAR(255) DEFAULT NULL,
  `expiry_date` VARCHAR(255) DEFAULT NULL,
  `hsn_code` VARCHAR(255) DEFAULT NULL,
  `sale_type` VARCHAR(255) DEFAULT 'FULL_PACK',
  `quantity` INT DEFAULT 1,
  `unit_price` DOUBLE DEFAULT 0,
  `mrp` DOUBLE DEFAULT 0,
  `cost_price` DOUBLE DEFAULT 0,
  `discount_percent` DOUBLE DEFAULT 0,
  `gst_rate` INT DEFAULT 12,
  `tax_amount` DOUBLE DEFAULT 0,
  `subtotal` DOUBLE DEFAULT 0,
  `total` DOUBLE DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_invoice_items_inv` (`invoice_id`),
  CONSTRAINT `fk_invoice_items_inv` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `invoices` (`id`, `invoice_number`, `timestamp`, `customer_name`, `customer_phone`, `doctor_name`, `doctor_reg_no`, `subtotal`, `total_discount`, `cgst`, `sgst`, `total_tax`, `round_off`, `grand_total`, `total_cost_price`, `gross_profit`, `payment_mode`, `payment_status`, `has_scheduleh`, `dispensed_by`) VALUES
(1, 'INV-2025-0001', NOW() - INTERVAL 1 DAY, 'Vikram Malhotra', '+91 98199 44332', 'Dr. Sneha Roy', 'MMC-2016-89421', 210.80, 3.20, 12.25, 12.25, 24.51, 0.69, 236.00, 155.00, 81.00, 'UPI', 'PAID', b'1', 'Counter 1');

INSERT INTO `invoice_items` (`id`, `invoice_id`, `medicine_id`, `medicine_name`, `generic_name`, `batch_number`, `expiry_date`, `hsn_code`, `sale_type`, `quantity`, `unit_price`, `mrp`, `cost_price`, `discount_percent`, `gst_rate`, `tax_amount`, `subtotal`, `total`) VALUES
(1, 1, 2, 'Dolo 650', 'Paracetamol (650mg)', 'DL65-11', '2026-03', '30049060', 'FULL_PACK', 2, 32.00, 33.60, 22.50, 5.0, 12, 6.51, 60.80, 67.31),
(2, 1, 3, 'Pan 40', 'Pantoprazole Gastro-resistant (40mg)', 'PAN4-90', '2025-12', '30049099', 'FULL_PACK', 1, 150.00, 155.00, 110.00, 0.0, 12, 18.00, 150.00, 168.00);

-- ----------------------------------------------------------------------------
-- 9. STORE ORDERS & ORDER ITEMS (Doctor & Customer Prescriptions)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_audit_logs`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `store_orders`;

CREATE TABLE `store_orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(255) NOT NULL,
  `order_type` VARCHAR(255) NOT NULL,
  `store_id` BIGINT DEFAULT NULL,
  `store_name` VARCHAR(255) DEFAULT NULL,
  `placed_by_user_id` BIGINT DEFAULT NULL,
  `placed_by_user_name` VARCHAR(255) DEFAULT NULL,
  `placed_by_user_role` VARCHAR(255) DEFAULT NULL,
  `placed_by_user_phone` VARCHAR(255) DEFAULT NULL,
  `doctor_reg_no` VARCHAR(255) DEFAULT NULL,
  `doctor_specialty` VARCHAR(255) DEFAULT NULL,
  `patient_name` VARCHAR(255) DEFAULT NULL,
  `patient_age` INT DEFAULT NULL,
  `patient_gender` VARCHAR(255) DEFAULT NULL,
  `patient_phone` VARCHAR(255) DEFAULT NULL,
  `diagnosis` VARCHAR(255) DEFAULT NULL,
  `prescription_notes` VARCHAR(1000) DEFAULT NULL,
  `delivery_address` VARCHAR(255) DEFAULT NULL,
  `payment_method` VARCHAR(255) NOT NULL,
  `payment_status` VARCHAR(255) NOT NULL,
  `total_amount` DOUBLE NOT NULL,
  `order_status` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT NULL,
  `packed_at` DATETIME DEFAULT NULL,
  `dispatched_at` DATETIME DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_number` (`order_number`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `store_order_id` BIGINT DEFAULT NULL,
  `medicine_id` BIGINT DEFAULT NULL,
  `medicine_name` VARCHAR(255) DEFAULT NULL,
  `generic_name` VARCHAR(255) DEFAULT NULL,
  `packaging` VARCHAR(255) DEFAULT NULL,
  `quantity` INT DEFAULT 1,
  `unit_price` DOUBLE DEFAULT 0,
  `total` DOUBLE DEFAULT 0,
  `dosage` VARCHAR(255) DEFAULT NULL,
  `timing` VARCHAR(255) DEFAULT NULL,
  `duration_days` INT DEFAULT 30,
  PRIMARY KEY (`id`),
  KEY `fk_order_items_order` (`store_order_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`store_order_id`) REFERENCES `store_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_audit_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `store_order_id` BIGINT DEFAULT NULL,
  `timestamp` DATETIME NOT NULL,
  `from_status` VARCHAR(255) DEFAULT NULL,
  `to_status` VARCHAR(255) NOT NULL,
  `updated_by` VARCHAR(255) NOT NULL,
  `comments` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_order_audit_order` (`store_order_id`),
  CONSTRAINT `fk_order_audit_order` FOREIGN KEY (`store_order_id`) REFERENCES `store_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `store_orders` (`id`, `order_number`, `order_type`, `store_id`, `store_name`, `placed_by_user_id`, `placed_by_user_name`, `placed_by_user_role`, `placed_by_user_phone`, `doctor_reg_no`, `doctor_specialty`, `patient_name`, `patient_age`, `patient_gender`, `patient_phone`, `diagnosis`, `prescription_notes`, `delivery_address`, `payment_method`, `payment_status`, `total_amount`, `order_status`, `created_at`) VALUES
(1, 'ORD-2025-0101', 'DOCTOR_PRESCRIPTION', 1, 'MediCare Pharmacy & SuperStore (Main Branch)', 4, 'Dr. Sneha Roy, MBBS, MD', 'DOCTOR', '+91 98201 88990', 'MMC-2016-89421', 'Internal Medicine & Chronic Care', 'Rameshwar Sharma', 54, 'Male', '+91 98334 11223', 'Type 2 Diabetes Mellitus with Essential Hypertension', 'Patient advised low sodium diet. Review HbA1c in 3 months.', 'Home Delivery: 102/B, Sai Krupa CHS, Tilak Nagar, Mumbai', 'COD', 'PENDING_COLLECTION', 870.00, 'NEW_RECEIVED', NOW() - INTERVAL 2 DAY);

INSERT INTO `order_items` (`id`, `store_order_id`, `medicine_id`, `medicine_name`, `generic_name`, `packaging`, `quantity`, `unit_price`, `total`, `dosage`, `timing`, `duration_days`) VALUES
(1, 1, 6, 'Telma 40', 'Telmisartan (40mg)', '15 Tablets/Strip', 2, 210.00, 420.00, '1-0-0', 'Morning after breakfast', 30),
(2, 1, 10, 'Glycomet-GP 2', 'Glimepiride (2mg) + Metformin Hydrochloride (500mg)', '15 Tablets/Strip', 2, 225.00, 450.00, '1-0-1', 'Before meals with water', 30);

-- Re-enable Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 1;
