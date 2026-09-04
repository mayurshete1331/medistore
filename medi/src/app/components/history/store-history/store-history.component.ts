import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { StoreHistoryLog, StoreEventType } from '../../../core/models/store-client-history.model';
import { AddClientModalComponent } from '../../clients/add-client-modal/add-client-modal.component';

@Component({
  selector: 'app-store-history',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, AddClientModalComponent],
  templateUrl: './store-history.component.html',
  styleUrls: ['./store-history.component.scss']
})
export class StoreHistoryComponent implements OnInit {
  private api = inject(ApiService);
  readonly authService = inject(AuthService);

  readonly historyLogs = signal<StoreHistoryLog[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly selectedFilter = signal<string>('ALL');
  readonly searchTerm = signal<string>('');

  // Add note modal state
  readonly showNoteModal = signal<boolean>(false);
  readonly showAddClientModal = signal<boolean>(false);
  readonly noteTitle = signal<string>('');
  readonly noteDescription = signal<string>('');
  readonly isSubmittingNote = signal<boolean>(false);

  get currentStore() {
    return this.authService.selectedStore();
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  // Filtered list
  readonly filteredLogs = computed(() => {
    let list = this.historyLogs();
    const filter = this.selectedFilter();
    const search = this.searchTerm().trim().toLowerCase();

    if (filter !== 'ALL') {
      list = list.filter(l => l.eventType === filter);
    }

    if (search) {
      list = list.filter(l =>
        (l.title && l.title.toLowerCase().includes(search)) ||
        (l.description && l.description.toLowerCase().includes(search)) ||
        (l.performedBy && l.performedBy.toLowerCase().includes(search)) ||
        (l.referenceId && l.referenceId.toLowerCase().includes(search))
      );
    }

    return list;
  });

  // KPI counters
  readonly totalEvents = computed(() => this.historyLogs().length);
  readonly totalSales = computed(() => this.historyLogs().filter(l => l.eventType === 'SALE_BILLING').length);
  readonly totalClients = computed(() => this.historyLogs().filter(l => l.eventType === 'CUSTOMER_ADDED' || l.eventType === 'DOCTOR_ADDED').length);
  readonly totalInventory = computed(() => this.historyLogs().filter(l => l.eventType === 'INVENTORY_CHANGE').length);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    const storeId = this.currentStore?.id || '1';
    this.isLoading.set(true);

    this.api.getStoreHistory(storeId).subscribe({
      next: (logs) => {
        this.historyLogs.set(logs || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load store history', err);
        this.isLoading.set(false);
      }
    });
  }

  setFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }

  getEventBadgeClass(type: StoreEventType): string {
    switch (type) {
      case 'SALE_BILLING': return 'badge-sale';
      case 'CUSTOMER_ADDED': return 'badge-customer';
      case 'DOCTOR_ADDED': return 'badge-doctor';
      case 'ORDER_RECEIVED':
      case 'ORDER_STATUS': return 'badge-order';
      case 'INVENTORY_CHANGE': return 'badge-inventory';
      case 'PURCHASE_REORDER': return 'badge-reorder';
      case 'MANUAL_NOTE': return 'badge-note';
      default: return 'badge-default';
    }
  }

  getEventIcon(type: StoreEventType): string {
    switch (type) {
      case 'SALE_BILLING': return '💳';
      case 'CUSTOMER_ADDED': return '👤';
      case 'DOCTOR_ADDED': return '🩺';
      case 'ORDER_RECEIVED': return '📥';
      case 'ORDER_STATUS': return '📦';
      case 'INVENTORY_CHANGE': return '📊';
      case 'PURCHASE_REORDER': return '🛒';
      case 'MANUAL_NOTE': return '📝';
      default: return '📌';
    }
  }

  openNoteModal(): void {
    this.noteTitle.set('');
    this.noteDescription.set('');
    this.showNoteModal.set(true);
  }

  closeNoteModal(): void {
    this.showNoteModal.set(false);
  }

  submitNote(): void {
    if (!this.noteTitle().trim() || !this.noteDescription().trim()) return;

    const storeId = this.currentStore?.id || '1';
    this.isSubmittingNote.set(true);

    const payload = {
      title: this.noteTitle().trim(),
      description: this.noteDescription().trim(),
      performedBy: this.currentUser.name || 'Store Owner',
      eventType: 'MANUAL_NOTE'
    };

    this.api.addStoreHistoryNote(storeId, payload).subscribe({
      next: () => {
        this.isSubmittingNote.set(false);
        this.closeNoteModal();
        this.loadHistory();
      },
      error: (err) => {
        console.error('Failed to save store note', err);
        this.isSubmittingNote.set(false);
      }
    });
  }

  openAddClientModal(): void {
    this.showAddClientModal.set(true);
  }

  onClientAdded(): void {
    this.loadHistory();
  }
}
