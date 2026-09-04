import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { MedicineCategory } from '../models/medicine.model';

export interface DrugSuggestion {
  brandName: string;
  genericName: string;
  category: MedicineCategory;
  manufacturer: string;
  hsnCode: string;
  gstRate: number;
  packaging: string;
  unitsPerPack: number;
  unitLabel: string;
  isScheduleH: boolean;
  isScheduleH1: boolean;
  isNarcotic: boolean;
  defaultReorderQty: number;
  reorderLevel: number;
  mrp?: number;
  salePrice?: number;
  purchasePrice?: number;
  barcode?: string;
  source: 'LOCAL_MASTER' | 'NLM_API';
}

@Injectable({
  providedIn: 'root'
})
export class DrugLookupService {
  private http = inject(HttpClient);

  // Curated Master Catalog of Top Indian Pharmaceutical Formulations
  private readonly MASTER_DRUGS: Omit<DrugSuggestion, 'source'>[] = [
    {
      brandName: 'Augmentin 625 Duo',
      genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
      category: 'Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals',
      hsnCode: '30041010',
      gstRate: 12,
      packaging: '10 Tablets/Strip',
      unitsPerPack: 10,
      unitLabel: 'Tab',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 25,
      defaultReorderQty: 50,
      purchasePrice: 145.00,
      mrp: 201.71,
      salePrice: 195.00,
      barcode: '890111700101'
    },
    {
      brandName: 'Dolo 650',
      genericName: 'Paracetamol (650mg)',
      category: 'Tablet',
      manufacturer: 'Micro Labs Ltd',
      hsnCode: '30049060',
      gstRate: 12,
      packaging: '15 Tablets/Strip',
      unitsPerPack: 15,
      unitLabel: 'Tab',
      isScheduleH: false,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 40,
      defaultReorderQty: 100,
      purchasePrice: 22.50,
      mrp: 33.60,
      salePrice: 32.00,
      barcode: '890111700102'
    },
    {
      brandName: 'Pan 40',
      genericName: 'Pantoprazole Gastro-resistant (40mg)',
      category: 'Tablet',
      manufacturer: 'Alkem Laboratories Ltd',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '15 Tablets/Strip',
      unitsPerPack: 15,
      unitLabel: 'Tab',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 30,
      defaultReorderQty: 60,
      purchasePrice: 110.00,
      mrp: 155.00,
      salePrice: 150.00,
      barcode: '890111700103'
    },
    {
      brandName: 'Pan-D',
      genericName: 'Pantoprazole (40mg) + Domperidone SR (30mg)',
      category: 'Capsule',
      manufacturer: 'Alkem Laboratories Ltd',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '15 Capsules/Strip',
      unitsPerPack: 15,
      unitLabel: 'Cap',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 30,
      defaultReorderQty: 60,
      purchasePrice: 135.00,
      mrp: 199.00,
      salePrice: 190.00
    },
    {
      brandName: 'Azithral 500',
      genericName: 'Azithromycin (500mg)',
      category: 'Tablet',
      manufacturer: 'Alembic Pharmaceuticals Ltd',
      hsnCode: '30042010',
      gstRate: 12,
      packaging: '5 Tablets/Strip',
      unitsPerPack: 5,
      unitLabel: 'Tab',
      isScheduleH: true,
      isScheduleH1: true,
      isNarcotic: false,
      reorderLevel: 20,
      defaultReorderQty: 40,
      purchasePrice: 85.00,
      mrp: 132.00,
      salePrice: 128.00,
      barcode: '890111700104'
    },
    {
      brandName: 'Telma 40',
      genericName: 'Telmisartan (40mg)',
      category: 'Tablet',
      manufacturer: 'Glenmark Pharmaceuticals Ltd',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '15 Tablets/Strip',
      unitsPerPack: 15,
      unitLabel: 'Tab',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 25,
      defaultReorderQty: 50,
      purchasePrice: 150.00,
      mrp: 225.00,
      salePrice: 210.00,
      barcode: '890111700105'
    },
    {
      brandName: 'Telma-H',
      genericName: 'Telmisartan (40mg) + Hydrochlorothiazide (12.5mg)',
      category: 'Tablet',
      manufacturer: 'Glenmark Pharmaceuticals Ltd',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '15 Tablets/Strip',
      unitsPerPack: 15,
      unitLabel: 'Tab',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 20,
      defaultReorderQty: 40,
      purchasePrice: 175.00,
      mrp: 265.00,
      salePrice: 250.00
    },
    {
      brandName: 'Glycomet-GP 2',
      genericName: 'Glimepiride (2mg) + Metformin Hydrochloride SR (500mg)',
      category: 'Tablet',
      manufacturer: 'USV Private Limited',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '15 Tablets/Strip',
      unitsPerPack: 15,
      unitLabel: 'Tab',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 30,
      defaultReorderQty: 60,
      purchasePrice: 165.00,
      mrp: 245.00,
      salePrice: 235.00,
      barcode: '890111700106'
    },
    {
      brandName: 'Glycomet 500 SR',
      genericName: 'Metformin Hydrochloride Prolonged Release (500mg)',
      category: 'Tablet',
      manufacturer: 'USV Private Limited',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '20 Tablets/Strip',
      unitsPerPack: 20,
      unitLabel: 'Tab',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 30,
      defaultReorderQty: 60,
      purchasePrice: 38.00,
      mrp: 56.00,
      salePrice: 52.00
    },
    {
      brandName: 'Shelcal 500',
      genericName: 'Calcium (500mg) + Vitamin D3 (250 IU)',
      category: 'Tablet',
      manufacturer: 'Torrent Pharmaceuticals Ltd',
      hsnCode: '30045090',
      gstRate: 12,
      packaging: '15 Tablets/Strip',
      unitsPerPack: 15,
      unitLabel: 'Tab',
      isScheduleH: false,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 35,
      defaultReorderQty: 70,
      purchasePrice: 92.00,
      mrp: 131.00,
      salePrice: 125.00,
      barcode: '890111700108'
    },
    {
      brandName: 'Montair-LC',
      genericName: 'Montelukast (10mg) + Levocetirizine Dihydrochloride (5mg)',
      category: 'Tablet',
      manufacturer: 'Cipla Ltd',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '10 Tablets/Strip',
      unitsPerPack: 10,
      unitLabel: 'Tab',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 25,
      defaultReorderQty: 50,
      purchasePrice: 140.00,
      mrp: 215.00,
      salePrice: 205.00
    },
    {
      brandName: 'Ascoril D Plus Syrup',
      genericName: 'Dextromethorphan HBr + Phenylephrine + Chlorpheniramine',
      category: 'Syrup',
      manufacturer: 'Glenmark Pharmaceuticals Ltd',
      hsnCode: '30049080',
      gstRate: 12,
      packaging: '100ml Bottle',
      unitsPerPack: 1,
      unitLabel: 'Bottle',
      isScheduleH: false,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 20,
      defaultReorderQty: 40,
      purchasePrice: 90.00,
      mrp: 135.00,
      salePrice: 130.00,
      barcode: '890111700107'
    },
    {
      brandName: 'Ascoril LS Syrup',
      genericName: 'Levosalbutamol (1mg) + Ambroxol (30mg) + Guaiphenesin (50mg)',
      category: 'Syrup',
      manufacturer: 'Glenmark Pharmaceuticals Ltd',
      hsnCode: '30049080',
      gstRate: 12,
      packaging: '100ml Bottle',
      unitsPerPack: 1,
      unitLabel: 'Bottle',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 20,
      defaultReorderQty: 40,
      purchasePrice: 85.00,
      mrp: 124.00,
      salePrice: 118.00
    },
    {
      brandName: 'Clavam 625',
      genericName: 'Amoxicillin (500mg) + Potassium Clavulanate (125mg)',
      category: 'Tablet',
      manufacturer: 'Alkem Laboratories Ltd',
      hsnCode: '30041010',
      gstRate: 12,
      packaging: '10 Tablets/Strip',
      unitsPerPack: 10,
      unitLabel: 'Tab',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 25,
      defaultReorderQty: 50,
      purchasePrice: 142.00,
      mrp: 204.00,
      salePrice: 198.00
    },
    {
      brandName: 'Zifi 200',
      genericName: 'Cefixime Dispersible (200mg)',
      category: 'Tablet',
      manufacturer: 'FDC Limited',
      hsnCode: '30041010',
      gstRate: 12,
      packaging: '10 Tablets/Strip',
      unitsPerPack: 10,
      unitLabel: 'Tab',
      isScheduleH: true,
      isScheduleH1: true,
      isNarcotic: false,
      reorderLevel: 20,
      defaultReorderQty: 40,
      purchasePrice: 88.00,
      mrp: 130.00,
      salePrice: 125.00
    },
    {
      brandName: 'Taxim-O 200',
      genericName: 'Cefixime (200mg)',
      category: 'Tablet',
      manufacturer: 'Alkem Laboratories Ltd',
      hsnCode: '30041010',
      gstRate: 12,
      packaging: '10 Tablets/Strip',
      unitsPerPack: 10,
      unitLabel: 'Tab',
      isScheduleH: true,
      isScheduleH1: true,
      isNarcotic: false,
      reorderLevel: 20,
      defaultReorderQty: 40,
      purchasePrice: 115.00,
      mrp: 168.00,
      salePrice: 160.00
    },
    {
      brandName: 'Becosules Z',
      genericName: 'Vitamin B-Complex with Zinc & Vitamin C',
      category: 'Capsule',
      manufacturer: 'Pfizer Limited',
      hsnCode: '30045090',
      gstRate: 12,
      packaging: '20 Capsules/Strip',
      unitsPerPack: 20,
      unitLabel: 'Cap',
      isScheduleH: false,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 30,
      defaultReorderQty: 60,
      purchasePrice: 38.00,
      mrp: 52.00,
      salePrice: 48.00
    },
    {
      brandName: 'Allegra 120',
      genericName: 'Fexofenadine Hydrochloride (120mg)',
      category: 'Tablet',
      manufacturer: 'Sanofi India Ltd',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '10 Tablets/Strip',
      unitsPerPack: 10,
      unitLabel: 'Tab',
      isScheduleH: false,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 25,
      defaultReorderQty: 50,
      purchasePrice: 155.00,
      mrp: 232.00,
      salePrice: 220.00
    },
    {
      brandName: 'Combiflam',
      genericName: 'Ibuprofen (400mg) + Paracetamol (325mg)',
      category: 'Tablet',
      manufacturer: 'Sanofi India Ltd',
      hsnCode: '30049060',
      gstRate: 12,
      packaging: '20 Tablets/Strip',
      unitsPerPack: 20,
      unitLabel: 'Tab',
      isScheduleH: false,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 40,
      defaultReorderQty: 100,
      purchasePrice: 32.00,
      mrp: 47.00,
      salePrice: 45.00
    },
    {
      brandName: 'Ecosprin 75',
      genericName: 'Aspirin Gastro-resistant (75mg)',
      category: 'Tablet',
      manufacturer: 'USV Private Limited',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '14 Tablets/Strip',
      unitsPerPack: 14,
      unitLabel: 'Tab',
      isScheduleH: false,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 30,
      defaultReorderQty: 60,
      purchasePrice: 6.50,
      mrp: 10.50,
      salePrice: 9.50
    },
    {
      brandName: 'Omez 20',
      genericName: 'Omeprazole Gastro-resistant (20mg)',
      category: 'Capsule',
      manufacturer: 'Dr. Reddy Laboratories Ltd',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '20 Capsules/Strip',
      unitsPerPack: 20,
      unitLabel: 'Cap',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 30,
      defaultReorderQty: 60,
      purchasePrice: 68.00,
      mrp: 102.00,
      salePrice: 96.00
    },
    {
      brandName: 'Rosuvas 10',
      genericName: 'Rosuvastatin (10mg)',
      category: 'Tablet',
      manufacturer: 'Sun Pharmaceutical Industries Ltd',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '10 Tablets/Strip',
      unitsPerPack: 10,
      unitLabel: 'Tab',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 25,
      defaultReorderQty: 50,
      purchasePrice: 170.00,
      mrp: 260.00,
      salePrice: 245.00
    },
    {
      brandName: 'Asthalin Inhaler',
      genericName: 'Salbutamol Inhalation Aerosol (100mcg/puff)',
      category: 'Inhaler',
      manufacturer: 'Cipla Ltd',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '200 Metered Doses',
      unitsPerPack: 1,
      unitLabel: 'Canister',
      isScheduleH: true,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 15,
      defaultReorderQty: 30,
      purchasePrice: 110.00,
      mrp: 165.00,
      salePrice: 155.00
    },
    {
      brandName: 'Volini Gel',
      genericName: 'Diclofenac Diethylamine + Linseed Oil + Methyl Salicylate + Menthol',
      category: 'Ointment',
      manufacturer: 'Sun Pharmaceutical Industries Ltd',
      hsnCode: '30049099',
      gstRate: 12,
      packaging: '30g Tube',
      unitsPerPack: 1,
      unitLabel: 'Tube',
      isScheduleH: false,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 20,
      defaultReorderQty: 40,
      purchasePrice: 95.00,
      mrp: 145.00,
      salePrice: 138.00
    },
    {
      brandName: 'Neurobion Forte',
      genericName: 'Vitamin B1 + B2 + B3 + B5 + B6 + B12',
      category: 'Tablet',
      manufacturer: 'Procter & Gamble Health Ltd',
      hsnCode: '30045090',
      gstRate: 12,
      packaging: '30 Tablets/Strip',
      unitsPerPack: 30,
      unitLabel: 'Tab',
      isScheduleH: false,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 30,
      defaultReorderQty: 60,
      purchasePrice: 32.00,
      mrp: 46.00,
      salePrice: 42.00
    },
    {
      brandName: 'Benadryl Cough Syrup',
      genericName: 'Diphenhydramine Hydrochloride + Ammonium Chloride + Sodium Citrate',
      category: 'Syrup',
      manufacturer: 'Johnson & Johnson Pvt Ltd',
      hsnCode: '30049080',
      gstRate: 12,
      packaging: '100ml Bottle',
      unitsPerPack: 1,
      unitLabel: 'Bottle',
      isScheduleH: false,
      isScheduleH1: false,
      isNarcotic: false,
      reorderLevel: 20,
      defaultReorderQty: 40,
      purchasePrice: 85.00,
      mrp: 128.00,
      salePrice: 120.00
    }
  ];

  /**
   * Search drugs combining local pharma master and free public NLM Drug API
   */
  searchDrugs(query: string): Observable<DrugSuggestion[]> {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return of([]);

    // 1. Check local catalog
    const localMatches: DrugSuggestion[] = this.MASTER_DRUGS
      .filter(d => 
        d.brandName.toLowerCase().includes(q) || 
        d.genericName.toLowerCase().includes(q)
      )
      .map(d => ({ ...d, source: 'LOCAL_MASTER' as const }));

    // 2. Query free public NLM ClinicalTables API
    const nlmUrl = `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encodeURIComponent(q)}&ef=STRENGTHS_AND_FORMS`;

    return this.http.get<any>(nlmUrl).pipe(
      map(response => {
        const apiSuggestions: DrugSuggestion[] = [];

        // Response format: [count, [displayNames], {STRENGTHS_AND_FORMS: [[...]]}]
        if (Array.isArray(response) && response.length >= 2 && Array.isArray(response[1])) {
          const names: string[] = response[1];
          const extra = response[2]?.STRENGTHS_AND_FORMS || [];

          names.slice(0, 6).forEach((fullName: string, idx: number) => {
            // Check if already covered by local match
            if (localMatches.some(l => l.brandName.toLowerCase() === fullName.toLowerCase())) {
              return;
            }

            const strengthForm = Array.isArray(extra[idx]) && extra[idx].length > 0 ? extra[idx][0] : '';
            const category = this.inferCategory(fullName + ' ' + strengthForm);
            const unitsPerPack = category === 'Syrup' || category === 'Drops' || category === 'Ointment' || category === 'Inhaler' ? 1 : 10;
            const unitLabel = category === 'Tablet' ? 'Tab' : category === 'Capsule' ? 'Cap' : 'Unit';

            apiSuggestions.push({
              brandName: fullName,
              genericName: fullName + (strengthForm ? ` (${strengthForm})` : ''),
              category,
              manufacturer: 'Standard Pharma',
              hsnCode: '30049099',
              gstRate: 12,
              packaging: category === 'Tablet' ? `${unitsPerPack} Tablets/Strip` : `${unitsPerPack} Unit/Pack`,
              unitsPerPack,
              unitLabel,
              isScheduleH: true,
              isScheduleH1: false,
              isNarcotic: false,
              reorderLevel: 20,
              defaultReorderQty: 40,
              mrp: 120.00,
              salePrice: 110.00,
              purchasePrice: 75.00,
              source: 'NLM_API'
            });
          });
        }

        // Return combined list (Local matches first, then API matches, max 8)
        return [...localMatches, ...apiSuggestions].slice(0, 8);
      }),
      catchError(() => {
        // If NLM API is offline or unreachable, return local matches smoothly
        return of(localMatches.slice(0, 8));
      })
    );
  }

  /**
   * Return top popular Indian pharmaceutical presets for 1-click entry
   */
  getQuickPresets(): DrugSuggestion[] {
    return this.MASTER_DRUGS.slice(0, 8).map(d => ({
      ...d,
      source: 'LOCAL_MASTER' as const
    }));
  }

  private inferCategory(text: string): MedicineCategory {
    const lower = text.toLowerCase();
    if (lower.includes('syrup') || lower.includes('susp') || lower.includes('liquid') || lower.includes('solution')) return 'Syrup';
    if (lower.includes('cap')) return 'Capsule';
    if (lower.includes('inj') || lower.includes('vial') || lower.includes('amp')) return 'Injection';
    if (lower.includes('gel') || lower.includes('cream') || lower.includes('oint')) return 'Ointment';
    if (lower.includes('drop')) return 'Drops';
    if (lower.includes('inhal') || lower.includes('aerosol')) return 'Inhaler';
    return 'Tablet';
  }
}
