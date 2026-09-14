export type MedicineCategory = 
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Injection'
  | 'Ointment'
  | 'Drops'
  | 'Inhaler'
  | 'Surgical & Equipment';

export interface Batch {
  id: string;
  batchNumber: string;
  mfgDate: string;        // YYYY-MM
  expiryDate: string;     // YYYY-MM
  purchasePrice: number;  // Cost price to store per pack
  mrp: number;            // Maximum retail price per pack
  salePrice: number;      // Store sale price per pack
  stockPacks: number;     // Packs in stock
  stockUnits?: number;    // Calculated loose units
  looseUnits?: number;    // Open loose units from cut strips
}

export interface Medicine {
  id: string;
  brandName: string;
  genericName: string;    // Chemical composition / Salt
  category: MedicineCategory;
  manufacturer: string;
  hsnCode: string;
  gstRate: number;        // 0, 5, 12, 18%
  packaging: string;      // e.g. "10 Tabs/Strip", "100ml Bottle"
  unitsPerPack: number;   // e.g. 10 for tablets, 1 for syrup/bottles
  unitLabel: string;      // "Tab", "Cap", "ml", "Vial"
  rackLocation: string;   // e.g. "Rack A-04", "Shelf B-2"
  isScheduleH: boolean;   // Requires Doctor Prescription
  isScheduleH1: boolean;  // Strict Rx tracking
  isNarcotic: boolean;
  reorderLevel: number;   // Threshold in packs
  defaultReorderQty: number; // Default suggested pack qty
  barcode?: string;       // EAN-13, GS1 DataMatrix or QR barcode
  batches: Batch[];
  totalStockPacks: number;
}
