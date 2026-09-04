import { Medicine } from '../models/medicine.model';
import { Supplier } from '../models/supplier.model';
import { Invoice } from '../models/bill.model';

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Apollo MedSolutions & Distributors',
    contactPerson: 'Ramesh Patel',
    phone: '+91 98765 43210',
    whatsappNumber: '+919876543210',
    email: 'orders@apollomedsolutions.com',
    gstin: '27AABCA1234F1Z8',
    drugLicenseNo: 'MH-MZ4-20B-10928',
    address: 'Plot 42, Pharma Zone, MIDC Industrial Area, Mumbai 400093'
  },
  {
    id: 'sup-2',
    name: 'MediLife Pharma Distributors',
    contactPerson: 'Sanjay Sharma',
    phone: '+91 91234 56789',
    whatsappNumber: '+919123456789',
    email: 'supply@medilifepharma.in',
    gstin: '27AABCM9876E1Z5',
    drugLicenseNo: 'MH-PUN-21B-45812',
    address: 'Shop 12-14, Laxmi Market, Drug Quarter, Pune 411002'
  },
  {
    id: 'sup-3',
    name: 'Sunrise Care & Surgical Supplies',
    contactPerson: 'Dr. Vivek Verma',
    phone: '+91 99887 76655',
    whatsappNumber: '+919988776655',
    email: 'care@sunrisesurgicals.com',
    gstin: '27AABCS5544G1Z2',
    drugLicenseNo: 'MH-THN-20B-78321',
    address: 'B-7, Logistics Hub, Bhiwandi, Thane 421302'
  }
];

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    brandName: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
    category: 'Tablet',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals',
    hsnCode: '30041010',
    gstRate: 12,
    packaging: '10 Tablets/Strip',
    unitsPerPack: 10,
    unitLabel: 'Tab',
    rackLocation: 'Rack A-01',
    isScheduleH: true,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 25,
    defaultReorderQty: 50,
    totalStockPacks: 14, // Low Stock! (Trigger auto-reorder)
    batches: [
      {
        id: 'b-101',
        batchNumber: 'AUG2408',
        mfgDate: '2024-02',
        expiryDate: '2025-08',
        purchasePrice: 145.00,
        mrp: 201.71,
        salePrice: 195.00,
        stockPacks: 14
      }
    ]
  },
  {
    id: 'med-2',
    brandName: 'Dolo 650',
    genericName: 'Paracetamol (650mg)',
    category: 'Tablet',
    manufacturer: 'Micro Labs Ltd',
    hsnCode: '30049060',
    gstRate: 12,
    packaging: '15 Tablets/Strip',
    unitsPerPack: 15,
    unitLabel: 'Tab',
    rackLocation: 'Rack A-02',
    isScheduleH: false,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 40,
    defaultReorderQty: 100,
    totalStockPacks: 85,
    batches: [
      {
        id: 'b-201',
        batchNumber: 'DL65-11',
        mfgDate: '2024-04',
        expiryDate: '2026-03',
        purchasePrice: 22.50,
        mrp: 33.60,
        salePrice: 32.00,
        stockPacks: 45
      },
      {
        id: 'b-202',
        batchNumber: 'DL65-12',
        mfgDate: '2024-06',
        expiryDate: '2026-05',
        purchasePrice: 23.00,
        mrp: 33.60,
        salePrice: 32.00,
        stockPacks: 40
      }
    ]
  },
  {
    id: 'med-3',
    brandName: 'Pan 40',
    genericName: 'Pantoprazole (40mg)',
    category: 'Tablet',
    manufacturer: 'Alkem Laboratories Ltd',
    hsnCode: '30049099',
    gstRate: 12,
    packaging: '15 Tablets/Strip',
    unitsPerPack: 15,
    unitLabel: 'Tab',
    rackLocation: 'Rack B-03',
    isScheduleH: true,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 30,
    defaultReorderQty: 60,
    totalStockPacks: 52,
    batches: [
      {
        id: 'b-301',
        batchNumber: 'PAN4-90',
        mfgDate: '2024-01',
        expiryDate: '2025-12',
        purchasePrice: 110.00,
        mrp: 155.00,
        salePrice: 150.00,
        stockPacks: 52
      }
    ]
  },
  {
    id: 'med-4',
    brandName: 'Azithral 500',
    genericName: 'Azithromycin (500mg)',
    category: 'Tablet',
    manufacturer: 'Alembic Pharmaceuticals Ltd',
    hsnCode: '30042010',
    gstRate: 12,
    packaging: '5 Tablets/Strip',
    unitsPerPack: 5,
    unitLabel: 'Tab',
    rackLocation: 'Rack A-05',
    isScheduleH: true,
    isScheduleH1: true,
    isNarcotic: false,
    reorderLevel: 20,
    defaultReorderQty: 40,
    totalStockPacks: 8, // Low Stock!
    batches: [
      {
        id: 'b-401',
        batchNumber: 'AZT-220',
        mfgDate: '2024-03',
        expiryDate: '2025-09',
        purchasePrice: 85.00,
        mrp: 132.00,
        salePrice: 128.00,
        stockPacks: 8
      }
    ]
  },
  {
    id: 'med-5',
    brandName: 'Telma 40',
    genericName: 'Telmisartan (40mg)',
    category: 'Tablet',
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    hsnCode: '30049099',
    gstRate: 12,
    packaging: '15 Tablets/Strip',
    unitsPerPack: 15,
    unitLabel: 'Tab',
    rackLocation: 'Rack C-01',
    isScheduleH: true,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 25,
    defaultReorderQty: 50,
    totalStockPacks: 42,
    batches: [
      {
        id: 'b-501',
        batchNumber: 'TLM-789',
        mfgDate: '2024-05',
        expiryDate: '2026-04',
        purchasePrice: 150.00,
        mrp: 220.00,
        salePrice: 210.00,
        stockPacks: 42
      }
    ]
  },
  {
    id: 'med-6',
    brandName: 'Glycomet-GP 2',
    genericName: 'Glimepiride (2mg) + Metformin (500mg)',
    category: 'Tablet',
    manufacturer: 'USV Ltd',
    hsnCode: '30049099',
    gstRate: 12,
    packaging: '15 Tablets/Strip',
    unitsPerPack: 15,
    unitLabel: 'Tab',
    rackLocation: 'Rack C-04',
    isScheduleH: true,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 30,
    defaultReorderQty: 60,
    totalStockPacks: 5, // Critical Low Stock!
    batches: [
      {
        id: 'b-601',
        batchNumber: 'GLY-331',
        mfgDate: '2024-02',
        expiryDate: '2025-11',
        purchasePrice: 160.00,
        mrp: 235.00,
        salePrice: 225.00,
        stockPacks: 5
      }
    ]
  },
  {
    id: 'med-7',
    brandName: 'Ascoril D Plus Syrup',
    genericName: 'Dextromethorphan (10mg) + Phenylephrine (5mg) + Chlorpheniramine (2mg)',
    category: 'Syrup',
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    hsnCode: '30049099',
    gstRate: 12,
    packaging: '100ml Bottle',
    unitsPerPack: 1,
    unitLabel: 'Bottle',
    rackLocation: 'Rack S-02',
    isScheduleH: true,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 20,
    defaultReorderQty: 40,
    totalStockPacks: 18, // Low stock
    batches: [
      {
        id: 'b-701',
        batchNumber: 'ASC-512',
        mfgDate: '2024-03',
        expiryDate: '2026-02',
        purchasePrice: 90.00,
        mrp: 135.00,
        salePrice: 130.00,
        stockPacks: 18
      }
    ]
  },
  {
    id: 'med-8',
    brandName: 'Cetzine 10',
    genericName: 'Cetirizine Hydrochloride (10mg)',
    category: 'Tablet',
    manufacturer: 'Dr Reddy Laboratories Ltd',
    hsnCode: '30049060',
    gstRate: 12,
    packaging: '10 Tablets/Strip',
    unitsPerPack: 10,
    unitLabel: 'Tab',
    rackLocation: 'Rack A-08',
    isScheduleH: false,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 30,
    defaultReorderQty: 80,
    totalStockPacks: 65,
    batches: [
      {
        id: 'b-801',
        batchNumber: 'CTZ-404',
        mfgDate: '2024-04',
        expiryDate: '2026-08',
        purchasePrice: 14.50,
        mrp: 23.00,
        salePrice: 22.00,
        stockPacks: 65
      }
    ]
  },
  {
    id: 'med-9',
    brandName: 'Volini Maxx Pain Spray',
    genericName: 'Diclofenac Diethylamine + Methyl Salicylate + Menthol',
    category: 'Ointment',
    manufacturer: 'Sun Pharmaceutical Industries Ltd',
    hsnCode: '30049011',
    gstRate: 12,
    packaging: '55g Can',
    unitsPerPack: 1,
    unitLabel: 'Can',
    rackLocation: 'Rack O-01',
    isScheduleH: false,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 15,
    defaultReorderQty: 30,
    totalStockPacks: 22,
    batches: [
      {
        id: 'b-901',
        batchNumber: 'VOL-801',
        mfgDate: '2024-05',
        expiryDate: '2026-04',
        purchasePrice: 180.00,
        mrp: 250.00,
        salePrice: 240.00,
        stockPacks: 22
      }
    ]
  },
  {
    id: 'med-10',
    brandName: 'Budecort 200 Inhaler',
    genericName: 'Budesonide (200mcg)',
    category: 'Inhaler',
    manufacturer: 'Cipla Ltd',
    hsnCode: '30049099',
    gstRate: 12,
    packaging: '200 MDI Canister',
    unitsPerPack: 1,
    unitLabel: 'Inhaler',
    rackLocation: 'Rack I-01',
    isScheduleH: true,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 10,
    defaultReorderQty: 25,
    totalStockPacks: 16,
    batches: [
      {
        id: 'b-1001',
        batchNumber: 'BUD-67',
        mfgDate: '2024-03',
        expiryDate: '2025-10',
        purchasePrice: 295.00,
        mrp: 412.00,
        salePrice: 399.00,
        stockPacks: 16
      }
    ]
  },
  {
    id: 'med-11',
    brandName: 'Betadine 10% Solution',
    genericName: 'Povidone-Iodine (10% w/v)',
    category: 'Drops',
    manufacturer: 'Win-Medicare Pvt Ltd',
    hsnCode: '30049099',
    gstRate: 12,
    packaging: '100ml Bottle',
    unitsPerPack: 1,
    unitLabel: 'Bottle',
    rackLocation: 'Rack S-05',
    isScheduleH: false,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 15,
    defaultReorderQty: 35,
    totalStockPacks: 28,
    batches: [
      {
        id: 'b-1101',
        batchNumber: 'BET-902',
        mfgDate: '2024-01',
        expiryDate: '2026-01',
        purchasePrice: 88.00,
        mrp: 130.00,
        salePrice: 125.00,
        stockPacks: 28
      }
    ]
  },
  {
    id: 'med-12',
    brandName: 'Lantus SoloStar Pen (100IU/ml)',
    genericName: 'Insulin Glargine (100IU/ml)',
    category: 'Injection',
    manufacturer: 'Sanofi India Ltd',
    hsnCode: '30043110',
    gstRate: 5,
    packaging: '3ml Cartridge Pen',
    unitsPerPack: 1,
    unitLabel: 'Pen',
    rackLocation: 'Cold Storage Chiller-1 (2-8°C)',
    isScheduleH: true,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 10,
    defaultReorderQty: 20,
    totalStockPacks: 4, // Critical Low Stock!
    batches: [
      {
        id: 'b-1201',
        batchNumber: 'LAN-554',
        mfgDate: '2024-04',
        expiryDate: '2025-07',
        purchasePrice: 580.00,
        mrp: 775.00,
        salePrice: 750.00,
        stockPacks: 4
      }
    ]
  },
  {
    id: 'med-13',
    brandName: 'Monocef 1g Injection',
    genericName: 'Ceftriaxone (1000mg)',
    category: 'Injection',
    manufacturer: 'Aristo Pharmaceuticals Ltd',
    hsnCode: '30042099',
    gstRate: 12,
    packaging: '1 Vial + WFI',
    unitsPerPack: 1,
    unitLabel: 'Vial',
    rackLocation: 'Rack J-02',
    isScheduleH: true,
    isScheduleH1: true,
    isNarcotic: false,
    reorderLevel: 30,
    defaultReorderQty: 100,
    totalStockPacks: 48,
    batches: [
      {
        id: 'b-1301',
        batchNumber: 'MCF-1029',
        mfgDate: '2024-02',
        expiryDate: '2026-02',
        purchasePrice: 42.00,
        mrp: 67.50,
        salePrice: 65.00,
        stockPacks: 48
      }
    ]
  },
  {
    id: 'med-14',
    brandName: 'Limcee 500 Vitamin C Chewable',
    genericName: 'Ascorbic Acid (500mg)',
    category: 'Tablet',
    manufacturer: 'Abbott Healthcare Pvt Ltd',
    hsnCode: '30045010',
    gstRate: 12,
    packaging: '15 Tablets/Strip',
    unitsPerPack: 15,
    unitLabel: 'Tab',
    rackLocation: 'Rack A-11',
    isScheduleH: false,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 50,
    defaultReorderQty: 100,
    totalStockPacks: 92,
    batches: [
      {
        id: 'b-1401',
        batchNumber: 'LIM-992',
        mfgDate: '2024-05',
        expiryDate: '2026-05',
        purchasePrice: 18.00,
        mrp: 29.50,
        salePrice: 28.00,
        stockPacks: 92
      }
    ]
  },
  {
    id: 'med-15',
    brandName: 'Dr Trust Digital Thermometer',
    genericName: 'Waterproof Digital Body Temperature Scanner',
    category: 'Surgical & Equipment',
    manufacturer: 'Nureca Ltd',
    hsnCode: '90251910',
    gstRate: 18,
    packaging: '1 Piece Box',
    unitsPerPack: 1,
    unitLabel: 'Piece',
    rackLocation: 'Surgical Section S-1',
    isScheduleH: false,
    isScheduleH1: false,
    isNarcotic: false,
    reorderLevel: 8,
    defaultReorderQty: 20,
    totalStockPacks: 12,
    batches: [
      {
        id: 'b-1501',
        batchNumber: 'DT-2024-A',
        mfgDate: '2024-01',
        expiryDate: '2029-12',
        purchasePrice: 160.00,
        mrp: 299.00,
        salePrice: 275.00,
        stockPacks: 12
      }
    ]
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-2025-001',
    timestamp: '2025-09-01T10:15:00',
    customer: {
      name: 'Rajesh Sharma',
      phone: '+91 98201 12345',
      doctorName: 'Dr. Anand Kulkarni',
      doctorRegNo: 'MCI-45812'
    },
    items: [
      {
        id: 'ci-1',
        medicine: INITIAL_MEDICINES[0],
        selectedBatch: INITIAL_MEDICINES[0].batches[0],
        saleType: 'FULL_PACK',
        quantity: 2,
        unitPrice: 195.00,
        mrp: 201.71,
        costPrice: 145.00,
        discountPercent: 5,
        gstRate: 12,
        taxAmount: 41.78,
        subtotal: 370.50,
        total: 412.28
      },
      {
        id: 'ci-2',
        medicine: INITIAL_MEDICINES[1],
        selectedBatch: INITIAL_MEDICINES[1].batches[0],
        saleType: 'FULL_PACK',
        quantity: 3,
        unitPrice: 32.00,
        mrp: 33.60,
        costPrice: 22.50,
        discountPercent: 0,
        gstRate: 12,
        taxAmount: 11.52,
        subtotal: 96.00,
        total: 107.52
      }
    ],
    subtotal: 466.50,
    totalDiscount: 19.50,
    cgst: 26.65,
    sgst: 26.65,
    totalTax: 53.30,
    roundOff: -0.20,
    grandTotal: 520.00,
    totalCostPrice: 357.50,
    grossProfit: 109.00,
    paymentMode: 'UPI',
    paymentStatus: 'PAID',
    hasScheduleH: true,
    dispensedBy: 'Chief Pharmacist'
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-2025-002',
    timestamp: '2025-09-02T14:30:00',
    customer: {
      name: 'Pooja Iyer',
      phone: '+91 97654 88990',
      doctorName: 'Dr. Neha Gupta'
    },
    items: [
      {
        id: 'ci-3',
        medicine: INITIAL_MEDICINES[2],
        selectedBatch: INITIAL_MEDICINES[2].batches[0],
        saleType: 'FULL_PACK',
        quantity: 2,
        unitPrice: 150.00,
        mrp: 155.00,
        costPrice: 110.00,
        discountPercent: 10,
        gstRate: 12,
        taxAmount: 32.40,
        subtotal: 270.00,
        total: 302.40
      },
      {
        id: 'ci-4',
        medicine: INITIAL_MEDICINES[7],
        selectedBatch: INITIAL_MEDICINES[7].batches[0],
        saleType: 'FULL_PACK',
        quantity: 2,
        unitPrice: 22.00,
        mrp: 23.00,
        costPrice: 14.50,
        discountPercent: 0,
        gstRate: 12,
        taxAmount: 5.28,
        subtotal: 44.00,
        total: 49.28
      }
    ],
    subtotal: 314.00,
    totalDiscount: 30.00,
    cgst: 18.84,
    sgst: 18.84,
    totalTax: 37.68,
    roundOff: 0.32,
    grandTotal: 352.00,
    totalCostPrice: 249.00,
    grossProfit: 65.00,
    paymentMode: 'CASH',
    paymentStatus: 'PAID',
    hasScheduleH: true,
    dispensedBy: 'Counter 1'
  },
  {
    id: 'inv-1003',
    invoiceNumber: 'INV-2025-003',
    timestamp: '2025-09-03T18:45:00',
    customer: {
      name: 'Sunil Rao',
      phone: '+91 99302 44112',
      doctorName: 'Dr. H. Mehta'
    },
    items: [
      {
        id: 'ci-5',
        medicine: INITIAL_MEDICINES[11],
        selectedBatch: INITIAL_MEDICINES[11].batches[0],
        saleType: 'FULL_PACK',
        quantity: 2,
        unitPrice: 750.00,
        mrp: 775.00,
        costPrice: 580.00,
        discountPercent: 5,
        gstRate: 5,
        taxAmount: 71.25,
        subtotal: 1425.00,
        total: 1496.25
      },
      {
        id: 'ci-6',
        medicine: INITIAL_MEDICINES[4],
        selectedBatch: INITIAL_MEDICINES[4].batches[0],
        saleType: 'FULL_PACK',
        quantity: 2,
        unitPrice: 210.00,
        mrp: 220.00,
        costPrice: 150.00,
        discountPercent: 5,
        gstRate: 12,
        taxAmount: 47.88,
        subtotal: 399.00,
        total: 446.88
      }
    ],
    subtotal: 1824.00,
    totalDiscount: 96.00,
    cgst: 59.57,
    sgst: 59.57,
    totalTax: 119.13,
    roundOff: -0.13,
    grandTotal: 1943.00,
    totalCostPrice: 1460.00,
    grossProfit: 364.00,
    paymentMode: 'CARD',
    paymentStatus: 'PAID',
    hasScheduleH: true,
    dispensedBy: 'Counter 2'
  }
];
