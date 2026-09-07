-- ============================================================================
-- MediStore - Open Indian Drug Master Catalog Seed Script (Option A)
-- Database: medi_db
-- Run this script in MySQL Workbench, DBeaver, or via mysql CLI:
-- mysql -u root -p medi_db < indian_medicines_catalog_seed.sql
-- ============================================================================

USE `medi_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- Clear existing medicine and batch records to load fresh complete catalog
-- ----------------------------------------------------------------------------
TRUNCATE TABLE `batches`;
DELETE FROM `medicines`;
ALTER TABLE `medicines` AUTO_INCREMENT = 1;
ALTER TABLE `batches` AUTO_INCREMENT = 1;

-- ----------------------------------------------------------------------------
-- INSERT 85+ TOP INDIAN PHARMACEUTICAL FORMULATIONS
-- ----------------------------------------------------------------------------
INSERT INTO `medicines` 
(`id`, `brand_name`, `generic_name`, `category`, `manufacturer`, `hsn_code`, `gst_rate`, `packaging`, `units_per_pack`, `unit_label`, `rack_location`, `is_scheduleh`, `is_scheduleh1`, `is_narcotic`, `reorder_level`, `default_reorder_qty`, `barcode`) VALUES

-- --- CARDIOVASCULAR & ANTI-HYPERTENSIVE ---
(1, 'Telmikaa AMH', 'Telmisartan (40mg) + Amlodipine (5mg) + Hydrochlorothiazide (12.5mg)', 'Tablet', 'Mankind Pharma Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack C-01', b'1', b'0', b'0', 25, 50, '890111700125'),
(2, 'Telma AMH', 'Telmisartan (40mg) + Amlodipine (5mg) + Hydrochlorothiazide (12.5mg)', 'Tablet', 'Glenmark Pharmaceuticals Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack C-01', b'1', b'0', b'0', 25, 50, '890111700126'),
(3, 'Telmikind AMH', 'Telmisartan (40mg) + Amlodipine (5mg) + Hydrochlorothiazide (12.5mg)', 'Tablet', 'Mankind Pharma Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack C-01', b'1', b'0', b'0', 25, 50, '890111700127'),
(4, 'Telpres AMH', 'Telmisartan (40mg) + Amlodipine (5mg) + Hydrochlorothiazide (12.5mg)', 'Tablet', 'Abbott India Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack C-01', b'1', b'0', b'0', 25, 50, '890111700128'),
(5, 'Telma 40', 'Telmisartan (40mg)', 'Tablet', 'Glenmark Pharmaceuticals Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-02', b'1', b'0', b'0', 30, 60, '890111700105'),
(6, 'Telma 80', 'Telmisartan (80mg)', 'Tablet', 'Glenmark Pharmaceuticals Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-02', b'1', b'0', b'0', 20, 40, '890111700129'),
(7, 'Telma-H', 'Telmisartan (40mg) + Hydrochlorothiazide (12.5mg)', 'Tablet', 'Glenmark Pharmaceuticals Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-02', b'1', b'0', b'0', 25, 50, '890111700130'),
(8, 'Telma-CT 40/12.5', 'Telmisartan (40mg) + Chlorthalidone (12.5mg)', 'Tablet', 'Glenmark Pharmaceuticals Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-02', b'1', b'0', b'0', 20, 40, '890111700131'),
(9, 'Amlong 5', 'Amlodipine Besylate (5mg)', 'Tablet', 'Micro Labs Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-03', b'1', b'0', b'0', 30, 60, '890111700132'),
(10, 'Cilacar 10', 'Cilnidipine (10mg)', 'Tablet', 'J.B. Chemicals & Pharmaceuticals Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-03', b'1', b'0', b'0', 25, 50, '890111700133'),
(11, 'Concor 5', 'Bisoprolol Fumarate (5mg)', 'Tablet', 'Procter & Gamble Health Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack C-04', b'1', b'0', b'0', 20, 40, '890111700134'),
(12, 'Metosartan 50', 'Metoprolol Succinate (50mg) + Telmisartan (40mg)', 'Tablet', 'Sun Pharmaceutical Industries Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-04', b'1', b'0', b'0', 25, 50, '890111700135'),
(13, 'Ecosprin 75', 'Aspirin Gastro-resistant (75mg)', 'Tablet', 'USV Private Limited', '30049099', 12, '14 Tablets/Strip', 14, 'Tab', 'Rack C-05', b'0', b'0', b'0', 40, 100, '890111700136'),
(14, 'Ecosprin 150', 'Aspirin Gastro-resistant (150mg)', 'Tablet', 'USV Private Limited', '30049099', 12, '14 Tablets/Strip', 14, 'Tab', 'Rack C-05', b'0', b'0', b'0', 30, 60, '890111700137'),
(15, 'Ecosprin-AV 75/20', 'Aspirin (75mg) + Atorvastatin (20mg)', 'Capsule', 'USV Private Limited', '30049099', 12, '15 Capsules/Strip', 15, 'Cap', 'Rack C-05', b'1', b'0', b'0', 25, 50, '890111700138'),
(16, 'Atorva 10', 'Atorvastatin Calcium (10mg)', 'Tablet', 'Zydus Lifesciences Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-06', b'1', b'0', b'0', 30, 60, '890111700139'),
(17, 'Atorva 20', 'Atorvastatin Calcium (20mg)', 'Tablet', 'Zydus Lifesciences Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-06', b'1', b'0', b'0', 25, 50, '890111700140'),
(18, 'Rosuvas 10', 'Rosuvastatin (10mg)', 'Tablet', 'Sun Pharmaceutical Industries Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack C-06', b'1', b'0', b'0', 30, 60, '890111700141'),

-- --- DIABETES & ENDOCRINOLOGY ---
(19, 'Glycomet-GP 2', 'Glimepiride (2mg) + Metformin Hydrochloride SR (500mg)', 'Tablet', 'USV Private Limited', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack D-01', b'1', b'0', b'0', 35, 70, '890111700142'),
(20, 'Glycomet-GP 1', 'Glimepiride (1mg) + Metformin Hydrochloride SR (500mg)', 'Tablet', 'USV Private Limited', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack D-01', b'1', b'0', b'0', 30, 60, '890111700143'),
(21, 'Glycomet 500 SR', 'Metformin Hydrochloride SR (500mg)', 'Tablet', 'USV Private Limited', '30049099', 12, '20 Tablets/Strip', 20, 'Tab', 'Rack D-01', b'1', b'0', b'0', 40, 80, '890111700144'),
(22, 'Janumet 50/500', 'Sitagliptin Phosphate (50mg) + Metformin (500mg)', 'Tablet', 'MSD Pharmaceuticals Pvt Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack D-02', b'1', b'0', b'0', 20, 40, '890111700145'),
(23, 'Galvus Met 50/500', 'Vildagliptin (50mg) + Metformin (500mg)', 'Tablet', 'Novartis India Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack D-02', b'1', b'0', b'0', 20, 40, '890111700146'),
(24, 'Zita-Met Plus 20/500', 'Teneligliptin (20mg) + Metformin (500mg)', 'Tablet', 'Glenmark Pharmaceuticals Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack D-02', b'1', b'0', b'0', 25, 50, '890111700147'),
(25, 'Lantus SoloStar Pen', 'Insulin Glargine (100IU/ml)', 'Injection', 'Sanofi India Ltd', '30043110', 5, '3ml Cartridge Pen', 1, 'Pen', 'Cold Storage-1', b'1', b'0', b'0', 10, 20, '890111700148'),
(26, 'Mixtard 30/70 FlexPen', 'Biphasic Isophane Insulin (100IU/ml)', 'Injection', 'Novo Nordisk India Pvt Ltd', '30043110', 5, '3ml Disposable Pen', 1, 'Pen', 'Cold Storage-1', b'1', b'0', b'0', 10, 20, '890111700149'),
(27, 'Thyronorm 50mcg', 'Thyroxine Sodium (50mcg)', 'Tablet', 'Abbott India Ltd', '30049099', 12, '120 Tablets/Bottle', 120, 'Bottle', 'Rack D-03', b'1', b'0', b'0', 20, 40, '890111700150'),
(28, 'Thyronorm 100mcg', 'Thyroxine Sodium (100mcg)', 'Tablet', 'Abbott India Ltd', '30049099', 12, '120 Tablets/Bottle', 120, 'Bottle', 'Rack D-03', b'1', b'0', b'0', 20, 40, '890111700151'),

-- --- ANTIBIOTICS & ANTIMICROBIALS ---
(29, 'Augmentin 625 Duo', 'Amoxicillin (500mg) + Clavulanic Acid (125mg)', 'Tablet', 'GlaxoSmithKline Pharmaceuticals', '30041010', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack A-01', b'1', b'0', b'0', 30, 60, '890111700101'),
(30, 'Clavam 625', 'Amoxicillin (500mg) + Clavulanic Acid (125mg)', 'Tablet', 'Alkem Laboratories Ltd', '30041010', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack A-01', b'1', b'0', b'0', 30, 60, '890111700152'),
(31, 'Moxikind-CV 625', 'Amoxicillin (500mg) + Potassium Clavulanate (125mg)', 'Tablet', 'Mankind Pharma Ltd', '30041010', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack A-01', b'1', b'0', b'0', 30, 60, '890111700153'),
(32, 'Azithral 500', 'Azithromycin (500mg)', 'Tablet', 'Alembic Pharmaceuticals Ltd', '30042010', 12, '5 Tablets/Strip', 5, 'Tab', 'Rack A-02', b'1', b'1', b'0', 25, 50, '890111700104'),
(33, 'Azee 500', 'Azithromycin (500mg)', 'Tablet', 'Cipla Ltd', '30042010', 12, '5 Tablets/Strip', 5, 'Tab', 'Rack A-02', b'1', b'1', b'0', 25, 50, '890111700154'),
(34, 'Taxim-O 200', 'Cefixime (200mg)', 'Tablet', 'Alkem Laboratories Ltd', '30042099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack A-03', b'1', b'1', b'0', 25, 50, '890111700155'),
(35, 'Zifi 200', 'Cefixime (200mg)', 'Tablet', 'FDC Limited', '30042099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack A-03', b'1', b'1', b'0', 25, 50, '890111700156'),
(36, 'Ceftum 500', 'Cefuroxime Axetil (500mg)', 'Tablet', 'GlaxoSmithKline Pharmaceuticals', '30042099', 12, '4 Tablets/Strip', 4, 'Tab', 'Rack A-04', b'1', b'1', b'0', 15, 30, '890111700157'),
(37, 'Monocef 1g Injection', 'Ceftriaxone Sodium (1000mg)', 'Injection', 'Aristo Pharmaceuticals Pvt Ltd', '30042099', 12, '1 Vial + WFI', 1, 'Vial', 'Rack A-05', b'1', b'1', b'0', 20, 50, '890111700158'),
(38, 'Ciplox 500', 'Ciprofloxacin (500mg)', 'Tablet', 'Cipla Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack A-06', b'1', b'1', b'0', 20, 40, '890111700159'),
(39, 'Oflox OZ', 'Ofloxacin (200mg) + Ornidazole (500mg)', 'Tablet', 'Cipla Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack A-06', b'1', b'1', b'0', 25, 50, '890111700160'),
(40, 'Norflox TZ', 'Norfloxacin (400mg) + Tinidazole (600mg)', 'Tablet', 'Cipla Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack A-06', b'1', b'1', b'0', 25, 50, '890111700161'),
(41, 'Metrogyl 400', 'Metronidazole (400mg)', 'Tablet', 'J.B. Chemicals & Pharmaceuticals Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack A-07', b'1', b'0', b'0', 30, 60, '890111700162'),

-- --- ANALGESICS, ANTI-INFLAMMATORY & PAIN ---
(42, 'Dolo 650', 'Paracetamol (650mg)', 'Tablet', 'Micro Labs Ltd', '30049060', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack B-01', b'0', b'0', b'0', 50, 100, '890111700102'),
(43, 'Calpol 650', 'Paracetamol (650mg)', 'Tablet', 'GlaxoSmithKline Pharmaceuticals', '30049060', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack B-01', b'0', b'0', b'0', 40, 80, '890111700163'),
(44, 'Combiflam', 'Ibuprofen (400mg) + Paracetamol (325mg)', 'Tablet', 'Sanofi India Ltd', '30049060', 12, '20 Tablets/Strip', 20, 'Tab', 'Rack B-02', b'0', b'0', b'0', 40, 100, '890111700164'),
(45, 'Zerodol-SP', 'Aceclofenac (100mg) + Paracetamol (325mg) + Serratiopeptidase (15mg)', 'Tablet', 'IPCA Laboratories Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack B-03', b'1', b'0', b'0', 35, 70, '890111700165'),
(46, 'Zerodol-P', 'Aceclofenac (100mg) + Paracetamol (325mg)', 'Tablet', 'IPCA Laboratories Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack B-03', b'1', b'0', b'0', 30, 60, '890111700166'),
(47, 'Hifenac-P', 'Aceclofenac (100mg) + Paracetamol (325mg)', 'Tablet', 'Intas Pharmaceuticals Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack B-03', b'1', b'0', b'0', 25, 50, '890111700167'),
(48, 'Voveran 50', 'Diclofenac Sodium (50mg)', 'Tablet', 'Novartis India Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack B-04', b'1', b'0', b'0', 25, 50, '890111700168'),
(49, 'Chymoral Forte', 'Trypsin-Chymotrypsin (100000 AU)', 'Tablet', 'Torrent Pharmaceuticals Ltd', '30049099', 12, '20 Tablets/Strip', 20, 'Tab', 'Rack B-04', b'1', b'0', b'0', 20, 40, '890111700169'),
(50, 'Meftal-Spas', 'Mefenamic Acid (250mg) + Dicyclomine Hydrochloride (10mg)', 'Tablet', 'Blue Cross Laboratories Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack B-05', b'1', b'0', b'0', 30, 60, '890111700170'),

-- --- GASTROENTEROLOGY & ANTACIDS ---
(51, 'Pan 40', 'Pantoprazole Gastro-resistant (40mg)', 'Tablet', 'Alkem Laboratories Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack E-01', b'1', b'0', b'0', 40, 80, '890111700103'),
(52, 'Pan-D', 'Pantoprazole (40mg) + Domperidone SR (30mg)', 'Capsule', 'Alkem Laboratories Ltd', '30049099', 12, '15 Capsules/Strip', 15, 'Cap', 'Rack E-01', b'1', b'0', b'0', 40, 80, '890111700171'),
(53, 'Pantocid DSR', 'Pantoprazole (40mg) + Domperidone SR (30mg)', 'Capsule', 'Sun Pharmaceutical Industries Ltd', '30049099', 12, '15 Capsules/Strip', 15, 'Cap', 'Rack E-01', b'1', b'0', b'0', 30, 60, '890111700172'),
(54, 'Omez 20', 'Omeprazole (20mg)', 'Capsule', 'Dr. Reddy Laboratories Ltd', '30049099', 12, '20 Capsules/Strip', 20, 'Cap', 'Rack E-02', b'1', b'0', b'0', 30, 60, '890111700173'),
(55, 'Omez-D', 'Omeprazole (20mg) + Domperidone (10mg)', 'Capsule', 'Dr. Reddy Laboratories Ltd', '30049099', 12, '15 Capsules/Strip', 15, 'Cap', 'Rack E-02', b'1', b'0', b'0', 25, 50, '890111700174'),
(56, 'Rabekind DSR', 'Rabeprazole (20mg) + Domperidone SR (30mg)', 'Capsule', 'Mankind Pharma Ltd', '30049099', 12, '10 Capsules/Strip', 10, 'Cap', 'Rack E-03', b'1', b'0', b'0', 30, 60, '890111700175'),
(57, 'Razo 20', 'Rabeprazole Sodium (20mg)', 'Tablet', 'Dr. Reddy Laboratories Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack E-03', b'1', b'0', b'0', 20, 40, '890111700176'),
(58, 'Aciloc 150', 'Ranitidine Hydrochloride (150mg)', 'Tablet', 'Cadila Pharmaceuticals Ltd', '30049099', 12, '30 Tablets/Strip', 30, 'Tab', 'Rack E-04', b'0', b'0', b'0', 40, 80, '890111700177'),
(59, 'Eldoper 2mg', 'Loperamide Hydrochloride (2mg)', 'Capsule', 'Micro Labs Ltd', '30049099', 12, '10 Capsules/Strip', 10, 'Cap', 'Rack E-04', b'1', b'0', b'0', 20, 40, '890111700178'),
(60, 'Duphalac Syrup', 'Lactulose Solution (3.335g/5ml)', 'Syrup', 'Abbott India Ltd', '30049080', 12, '200ml Bottle', 1, 'Bottle', 'Rack E-05', b'0', b'0', b'0', 15, 30, '890111700179'),
(61, 'Cremaffin Plus Syrup', 'Liquid Paraffin + Milk of Magnesia', 'Syrup', 'Abbott India Ltd', '30049080', 12, '225ml Bottle', 1, 'Bottle', 'Rack E-05', b'0', b'0', b'0', 15, 30, '890111700180'),
(62, 'Udiliv 300', 'Ursodeoxycholic Acid (300mg)', 'Tablet', 'Abbott India Ltd', '30049099', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack E-06', b'1', b'0', b'0', 15, 30, '890111700181'),

-- --- RESPIRATORY, COUGH & ALLERGY ---
(63, 'Montair-LC', 'Montelukast (10mg) + Levocetirizine (5mg)', 'Tablet', 'Cipla Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack F-01', b'1', b'0', b'0', 35, 70, '890111700182'),
(64, 'Montek-LC', 'Montelukast (10mg) + Levocetirizine (5mg)', 'Tablet', 'Sun Pharmaceutical Industries Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack F-01', b'1', b'0', b'0', 30, 60, '890111700183'),
(65, 'Allegra 120', 'Fexofenadine Hydrochloride (120mg)', 'Tablet', 'Sanofi India Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack F-02', b'0', b'0', b'0', 25, 50, '890111700184'),
(66, 'Sinarest', 'Paracetamol (500mg) + Phenylephrine (10mg) + Chlorpheniramine (2mg)', 'Tablet', 'Centaur Pharmaceuticals Pvt Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack F-02', b'0', b'0', b'0', 40, 80, '890111700185'),
(67, 'Cheston Cold', 'Cetirizine (5mg) + Paracetamol (325mg) + Phenylephrine (10mg)', 'Tablet', 'Cipla Ltd', '30049099', 12, '10 Tablets/Strip', 10, 'Tab', 'Rack F-02', b'0', b'0', b'0', 35, 70, '890111700186'),
(68, 'Ascoril D Plus Syrup', 'Dextromethorphan (10mg) + Phenylephrine (5mg) + Chlorpheniramine (2mg)', 'Syrup', 'Glenmark Pharmaceuticals Ltd', '30049080', 12, '100ml Bottle', 1, 'Bottle', 'Rack F-03', b'0', b'0', b'0', 25, 50, '890111700187'),
(69, 'Alex Syrup', 'Dextromethorphan + Chlorpheniramine + Phenylephrine', 'Syrup', 'Glenmark Pharmaceuticals Ltd', '30049080', 12, '100ml Bottle', 1, 'Bottle', 'Rack F-03', b'0', b'0', b'0', 20, 40, '890111700188'),
(70, 'Benadryl Cough Syrup', 'Diphenhydramine Hydrochloride + Ammonium Chloride', 'Syrup', 'Johnson & Johnson Pvt Ltd', '30049080', 12, '100ml Bottle', 1, 'Bottle', 'Rack F-03', b'0', b'0', b'0', 25, 50, '890111700189'),
(71, 'Asthalin Inhaler', 'Salbutamol Inhalation Aerosol (100mcg)', 'Inhaler', 'Cipla Ltd', '30049099', 12, '200 Metered Doses', 1, 'Canister', 'Rack F-04', b'1', b'0', b'0', 20, 40, '890111700190'),
(72, 'Foracort 200 Inhaler', 'Formoterol Fumarate (6mcg) + Budesonide (200mcg)', 'Inhaler', 'Cipla Ltd', '30049099', 12, '120 Metered Doses', 1, 'Canister', 'Rack F-04', b'1', b'0', b'0', 15, 30, '890111700191'),

-- --- VITAMINS, MINERALS & SUPPLEMENTS ---
(73, 'Shelcal 500', 'Calcium (500mg) + Vitamin D3 (250 IU)', 'Tablet', 'Torrent Pharmaceuticals Ltd', '30045090', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack G-01', b'0', b'0', b'0', 40, 80, '890111700192'),
(74, 'Shelcal HD', 'Calcium (500mg) + Vitamin D3 (500 IU)', 'Tablet', 'Torrent Pharmaceuticals Ltd', '30045090', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack G-01', b'0', b'0', b'0', 30, 60, '890111700193'),
(75, 'Becosules Z', 'Vitamin B-Complex with Zinc & Vitamin C', 'Capsule', 'Pfizer Limited', '30045090', 12, '20 Capsules/Strip', 20, 'Cap', 'Rack G-02', b'0', b'0', b'0', 45, 90, '890111700194'),
(76, 'Neurobion Forte', 'Vitamin B1 + B2 + B3 + B5 + B6 + B12', 'Tablet', 'Procter & Gamble Health Ltd', '30045090', 12, '30 Tablets/Strip', 30, 'Tab', 'Rack G-02', b'0', b'0', b'0', 40, 80, '890111700195'),
(77, 'Limcee 500', 'Vitamin C / Ascorbic Acid (500mg Chewable)', 'Tablet', 'Abbott India Ltd', '30045090', 12, '15 Tablets/Strip', 15, 'Tab', 'Rack G-03', b'0', b'0', b'0', 50, 100, '890111700196'),
(78, 'Celin 500', 'Vitamin C (500mg)', 'Tablet', 'GlaxoSmithKline Pharmaceuticals', '30045090', 12, '25 Tablets/Strip', 25, 'Tab', 'Rack G-03', b'0', b'0', b'0', 40, 80, '890111700197'),
(79, 'Uprise-D3 60K Capsule', 'Cholecalciferol / Vitamin D3 (60,000 IU)', 'Capsule', 'Alkem Laboratories Ltd', '30045090', 12, '4 Softgels/Strip', 4, 'Cap', 'Rack G-04', b'0', b'0', b'0', 35, 70, '890111700198'),
(80, 'Folvite 5mg', 'Folic Acid (5mg)', 'Tablet', 'Pfizer Limited', '30045090', 12, '45 Tablets/Strip', 45, 'Tab', 'Rack G-04', b'0', b'0', b'0', 30, 60, '890111700199'),
(81, 'Liv 52 DS', 'Herbal Hepatoprotective Extracts', 'Tablet', 'Himalaya Wellness Company', '30049011', 12, '60 Tablets/Bottle', 60, 'Bottle', 'Rack G-05', b'0', b'0', b'0', 30, 60, '890111700200'),

-- --- DERMATOLOGY & TOPICALS ---
(82, 'Volini Gel', 'Diclofenac Diethylamine + Linseed Oil + Menthol', 'Ointment', 'Sun Pharmaceutical Industries Ltd', '30049099', 12, '30g Tube', 1, 'Tube', 'Rack H-01', b'0', b'0', b'0', 25, 50, '890111700201'),
(83, 'Omnigel', 'Diclofenac Diethylamine + Virgin Linseed Oil + Methyl Salicylate', 'Ointment', 'Cipla Ltd', '30049099', 12, '30g Tube', 1, 'Tube', 'Rack H-01', b'0', b'0', b'0', 25, 50, '890111700202'),
(84, 'Betadine 10% Ointment', 'Povidone Iodine (10% w/w)', 'Ointment', 'Win-Medicare Pvt Ltd', '30049099', 12, '20g Tube', 1, 'Tube', 'Rack H-02', b'0', b'0', b'0', 30, 60, '890111700203'),
(85, 'Soframycin Skin Cream', 'Framycetin Sulphate (1% w/w)', 'Ointment', 'Sanofi India Ltd', '30042099', 12, '30g Tube', 1, 'Tube', 'Rack H-02', b'0', b'0', b'0', 30, 60, '890111700204'),
(86, 'Lulifin 1% Cream', 'Luliconazole (1% w/w)', 'Ointment', 'Sun Pharmaceutical Industries Ltd', '30049099', 12, '20g Tube', 1, 'Tube', 'Rack H-03', b'1', b'0', b'0', 20, 40, '890111700205'),
(87, 'Candid-B Cream', 'Clotrimazole (1% w/w) + Beclomethasone Dipropionate (0.025% w/w)', 'Ointment', 'Glenmark Pharmaceuticals Ltd', '30049099', 12, '20g Tube', 1, 'Tube', 'Rack H-03', b'1', b'0', b'0', 25, 50, '890111700206');

-- ----------------------------------------------------------------------------
-- INITIAL FEFO BATCHES & STOCK FOR EACH MEDICINE
-- ----------------------------------------------------------------------------
INSERT INTO `batches` (`medicine_id`, `batch_number`, `mfg_date`, `expiry_date`, `purchase_price`, `mrp`, `sale_price`, `stock_packs`) VALUES
(1, 'TLM-AMH-01', '2024-04', '2026-03', 110.00, 165.00, 155.00, 45),
(2, 'TLM-GLN-02', '2024-05', '2026-05', 120.00, 180.00, 170.00, 38),
(3, 'TLM-KND-03', '2024-03', '2026-02', 105.00, 158.00, 148.00, 30),
(4, 'TLP-ABT-04', '2024-06', '2026-06', 125.00, 185.00, 175.00, 25),
(5, 'TLM-789', '2024-05', '2026-04', 150.00, 220.00, 210.00, 55),
(6, 'TLM8-11', '2024-04', '2026-03', 210.00, 310.00, 295.00, 28),
(7, 'TLMH-12', '2024-02', '2025-11', 175.00, 265.00, 250.00, 35),
(8, 'TLMCT-09', '2024-03', '2026-01', 180.00, 275.00, 260.00, 20),
(9, 'AML5-99', '2024-01', '2026-08', 22.00, 34.00, 32.00, 80),
(10, 'CIL1-45', '2024-03', '2026-04', 98.00, 145.00, 138.00, 42),
(11, 'CNC5-22', '2024-02', '2026-05', 78.00, 115.00, 110.00, 30),
(12, 'MET5-77', '2024-04', '2026-02', 165.00, 245.00, 235.00, 35),
(13, 'ECO7-01', '2024-01', '2026-10', 8.50, 12.80, 12.00, 150),
(14, 'ECO1-02', '2024-02', '2026-11', 11.00, 16.50, 15.00, 90),
(15, 'ECAV-33', '2024-03', '2025-12', 65.00, 98.00, 92.00, 40),
(16, 'ATR1-12', '2024-04', '2026-05', 85.00, 128.00, 120.00, 50),
(17, 'ATR2-88', '2024-05', '2026-06', 145.00, 218.00, 205.00, 35),
(18, 'RSV1-65', '2024-02', '2026-04', 160.00, 240.00, 225.00, 45),

(19, 'GLY2-331', '2024-02', '2025-11', 160.00, 235.00, 225.00, 40),
(20, 'GLY1-209', '2024-03', '2026-01', 140.00, 210.00, 200.00, 35),
(21, 'GLM5-88', '2024-01', '2026-08', 35.00, 54.00, 50.00, 90),
(22, 'JNM-101', '2024-04', '2026-02', 280.00, 395.00, 375.00, 22),
(23, 'GVM-554', '2024-03', '2026-01', 260.00, 370.00, 350.00, 20),
(24, 'ZTM-401', '2024-05', '2026-04', 145.00, 215.00, 205.00, 30),
(25, 'LAN-554', '2024-04', '2025-07', 580.00, 775.00, 750.00, 15),
(26, 'MIX-701', '2024-03', '2025-09', 490.00, 660.00, 630.00, 18),
(27, 'THY5-11', '2024-02', '2026-10', 120.00, 168.00, 160.00, 45),
(28, 'THY1-22', '2024-03', '2026-11', 145.00, 205.00, 195.00, 40),

(29, 'AUG2408', '2024-02', '2025-08', 145.00, 201.71, 195.00, 35),
(30, 'CLM-625', '2024-03', '2025-10', 140.00, 198.00, 190.00, 40),
(31, 'MXK-109', '2024-04', '2025-11', 135.00, 190.00, 180.00, 35),
(32, 'AZT-220', '2024-03', '2025-09', 85.00, 132.00, 128.00, 45),
(33, 'AZE-501', '2024-04', '2025-12', 82.00, 128.00, 122.00, 40),
(34, 'TXM-202', '2024-02', '2025-11', 115.00, 168.00, 160.00, 30),
(35, 'ZIF-200', '2024-03', '2025-12', 112.00, 165.00, 158.00, 35),
(36, 'CFT-500', '2024-05', '2026-03', 290.00, 415.00, 395.00, 20),
(37, 'MNC-100', '2024-04', '2026-02', 45.00, 68.00, 65.00, 60),
(38, 'CIP-500', '2024-01', '2026-06', 32.00, 48.00, 45.00, 50),
(39, 'OFL-771', '2024-03', '2026-01', 95.00, 142.00, 135.00, 40),
(40, 'NRF-809', '2024-02', '2026-04', 78.00, 118.00, 112.00, 35),
(41, 'MTG-400', '2024-01', '2026-07', 16.00, 24.50, 23.00, 80),

(42, 'DL65-11', '2024-04', '2026-03', 22.50, 33.60, 32.00, 120),
(43, 'CLP-650', '2024-03', '2026-02', 24.00, 35.00, 33.00, 95),
(44, 'CMB-671', '2024-01', '2026-05', 32.00, 47.00, 45.00, 110),
(45, 'ZSP-991', '2024-04', '2026-02', 88.00, 128.00, 122.00, 50),
(46, 'ZP-102', '2024-02', '2026-04', 55.00, 82.00, 78.00, 45),
(47, 'HIF-701', '2024-03', '2026-01', 52.00, 78.00, 74.00, 40),
(48, 'VOV-501', '2024-01', '2026-08', 45.00, 68.00, 64.00, 40),
(49, 'CHY-882', '2024-05', '2026-04', 280.00, 410.00, 390.00, 25),
(50, 'MFT-301', '2024-03', '2026-05', 38.00, 56.00, 52.00, 60),

(51, 'PAN4-90', '2024-01', '2025-12', 110.00, 155.00, 150.00, 80),
(52, 'PAND-44', '2024-03', '2025-10', 135.00, 199.00, 190.00, 75),
(53, 'PCD-801', '2024-04', '2025-11', 145.00, 215.00, 205.00, 60),
(54, 'OMZ-202', '2024-02', '2026-03', 45.00, 68.00, 64.00, 70),
(55, 'OMZD-11', '2024-03', '2026-01', 95.00, 142.00, 135.00, 50),
(56, 'RBK-501', '2024-04', '2025-12', 130.00, 190.00, 180.00, 55),
(57, 'RZO-209', '2024-05', '2026-04', 160.00, 240.00, 225.00, 35),
(58, 'ACL-150', '2024-01', '2026-09', 28.00, 42.00, 40.00, 90),
(59, 'ELD-201', '2024-02', '2026-07', 15.00, 24.00, 22.00, 50),
(60, 'DPH-200', '2024-03', '2026-05', 185.00, 265.00, 250.00, 30),
(61, 'CRF-225', '2024-04', '2026-03', 190.00, 275.00, 260.00, 25),
(62, 'UDL-300', '2024-05', '2026-06', 420.00, 595.00, 570.00, 20),

(63, 'MNT-109', '2024-03', '2026-01', 140.00, 215.00, 205.00, 65),
(64, 'MTK-201', '2024-04', '2026-02', 135.00, 205.00, 195.00, 50),
(65, 'ALG-120', '2024-02', '2026-05', 145.00, 215.00, 205.00, 45),
(66, 'SNR-331', '2024-01', '2026-08', 42.00, 62.00, 58.00, 70),
(67, 'CHS-501', '2024-03', '2026-04', 38.00, 55.00, 52.00, 65),
(68, 'ASC-512', '2024-03', '2026-02', 90.00, 135.00, 130.00, 45),
(69, 'ALX-100', '2024-04', '2026-03', 95.00, 142.00, 135.00, 40),
(70, 'BND-100', '2024-02', '2026-05', 85.00, 128.00, 120.00, 50),
(71, 'AST-441', '2024-04', '2025-10', 110.00, 165.00, 155.00, 35),
(72, 'FRC-200', '2024-05', '2026-04', 340.00, 490.00, 465.00, 25),

(73, 'SHL-902', '2024-01', '2026-06', 92.00, 131.00, 125.00, 85),
(74, 'SHL-HD1', '2024-02', '2026-07', 105.00, 152.00, 145.00, 60),
(75, 'BCZ-332', '2024-02', '2026-04', 38.00, 52.00, 48.00, 80),
(76, 'NRB-901', '2024-03', '2026-08', 32.00, 46.00, 42.00, 75),
(77, 'LMC-500', '2024-01', '2026-10', 18.00, 26.50, 25.00, 120),
(78, 'CLN-500', '2024-02', '2026-09', 25.00, 38.00, 35.00, 80),
(79, 'UPR-60K', '2024-04', '2026-03', 135.00, 195.00, 185.00, 65),
(80, 'FLV-501', '2024-01', '2026-12', 45.00, 68.00, 65.00, 50),
(81, 'L52-100', '2024-03', '2027-02', 120.00, 175.00, 165.00, 55),

(82, 'VOL-819', '2024-03', '2026-08', 95.00, 145.00, 138.00, 60),
(83, 'OMN-301', '2024-04', '2026-09', 88.00, 135.00, 128.00, 50),
(84, 'BTD-201', '2024-02', '2026-05', 75.00, 115.00, 108.00, 55),
(85, 'SOF-301', '2024-01', '2026-07', 42.00, 62.00, 58.00, 65),
(86, 'LUL-201', '2024-05', '2026-04', 195.00, 285.00, 270.00, 30),
(87, 'CND-201', '2024-04', '2026-03', 115.00, 172.00, 162.00, 45);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Verification query:
-- SELECT COUNT(*) AS total_medicines FROM medicines;
-- SELECT COUNT(*) AS total_batches FROM batches;
-- ============================================================================
