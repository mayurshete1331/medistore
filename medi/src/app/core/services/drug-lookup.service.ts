import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { MedicineCategory } from '../models/medicine.model';
import { environment } from '../../../environments/environment';

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

  /**
   * Search drugs querying the live database API
   */
  searchDrugs(query: string): Observable<DrugSuggestion[]> {
    const q = (query || '').trim().toLowerCase();
    if (q.length < 2) return of([]);

    // Query Real Database through Spring Boot API
    const dbUrl = `${environment.apiUrl}/medicines?query=${encodeURIComponent(q)}`;

    return this.http.get<any[]>(dbUrl).pipe(
      map(dbMeds => {
        const dbSuggestions: DrugSuggestion[] = (dbMeds || []).map((m: any) => {
          const firstBatch = m.batches && m.batches.length > 0 ? m.batches[0] : null;
          return {
            brandName: m.brandName,
            genericName: m.genericName,
            category: (m.category || 'Tablet') as MedicineCategory,
            manufacturer: m.manufacturer || '',
            hsnCode: m.hsnCode || '30049099',
            gstRate: Number(m.gstRate) || 12,
            packaging: m.packaging || '10 Tablets/Strip',
            unitsPerPack: Number(m.unitsPerPack) || 10,
            unitLabel: m.unitLabel || 'Tab',
            isScheduleH: !!m.isScheduleH,
            isScheduleH1: !!m.isScheduleH1,
            isNarcotic: !!m.isNarcotic,
            reorderLevel: Number(m.reorderLevel) || 20,
            defaultReorderQty: Number(m.defaultReorderQty) || 50,
            mrp: firstBatch ? Number(firstBatch.mrp) : undefined,
            salePrice: firstBatch ? Number(firstBatch.salePrice) : undefined,
            purchasePrice: firstBatch ? Number(firstBatch.purchasePrice) : undefined,
            barcode: m.barcode,
            source: 'LOCAL_MASTER' as const
          };
        });

        return dbSuggestions.slice(0, 10);
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Return popular presets (empty as dummy catalog has been removed)
   */
  getQuickPresets(): DrugSuggestion[] {
    return [];
  }

  inferCategory(text: string): MedicineCategory {
    const lower = (text || '').toLowerCase();
    if (lower.includes('syrup') || lower.includes('susp') || lower.includes('liquid') || lower.includes('solution')) return 'Syrup';
    if (lower.includes('cap')) return 'Capsule';
    if (lower.includes('inj') || lower.includes('vial') || lower.includes('amp')) return 'Injection';
    if (lower.includes('gel') || lower.includes('cream') || lower.includes('oint')) return 'Ointment';
    if (lower.includes('drop')) return 'Drops';
    if (lower.includes('inhal') || lower.includes('aerosol')) return 'Inhaler';
    return 'Tablet';
  }
}
