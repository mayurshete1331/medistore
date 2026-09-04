import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../../core/models/bill.model';

@Component({
  selector: 'app-invoice-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-modal.component.html',
  styleUrls: ['./invoice-modal.component.scss']
})
export class InvoiceModalComponent {
  @Input({ required: true }) invoice!: Invoice;
  @Output() closed = new EventEmitter<void>();

  printInvoice(): void {
    window.print();
  }
}
