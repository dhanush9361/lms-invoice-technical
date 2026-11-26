import { CommonModule, Location } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

type ModalMode = 'invoice' | 'creditNote' | 'thankYou' | 'tax';
type TabId = 'setup' | 'appearance';

interface InvoiceForm {
  builtIn: boolean;
  invoicePrefix: string;
  nextInvoiceNumber: string;
  creditNotePrefix: string;
  nextCreditNoteNumber: string;
  vatNumber: string;
  discountInvoice: boolean;
  logoOption: 'none' | 'show';
  logoUrl: string | null;
  logoName: string;
  thankYou: string;
  taxMessage: string;
  texts: Record<string, string>;
  [key: string]: any;
}

@Component({
  selector: 'app-invoice-setup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-setup.html',
})
export class InvoiceSetup implements OnInit, OnDestroy {
  mounted = false;
  activeTab: TabId = 'setup';
  textsOpen = true;
  previewMenuOpen = false;

  modalOpen = false;
  modalVisible = false;
  modalMode: ModalMode = 'invoice';

  toast = '';
  logoError = '';

  private timers: ReturnType<typeof setTimeout>[] = [];

  readonly textGroups = [
    {
      title: 'Invoice Details',
      description: '',
      items: [
        { key: 'invoiceNumber', label: 'Invoice Number' },
        { key: 'invoice', label: 'Invoice' },
        { key: 'invoiceDate', label: 'Invoice Date' },
        { key: 'customerDetails', label: 'Customer Details' },
        { key: 'description', label: 'Description' },
        { key: 'unitPrice', label: 'Unit Price' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'subtotal', label: 'Subtotal' },
        { key: 'price', label: 'Price' },
        { key: 'discount', label: 'Discount' },
        { key: 'totalAmount', label: 'Total Amount' },
        { key: 'website', label: 'Website' },
        { key: 'email', label: 'Email' },
      ],
    },
    {
      title: 'Tax, Credit Note & Refund Details',
      description: 'Configure tax, credit note, and refund settings for your invoices',
      items: [
        { key: 'pricesIncludeTax', label: 'Prices Include Tax' },
        { key: 'tax', label: 'Tax' },
        { key: 'taxIncluded', label: 'Tax Included' },
        { key: 'refundReason', label: 'Refund Reason' },
        { key: 'refundMethod', label: 'Refund Method' },
        { key: 'invoiceReference', label: 'Invoice Reference' },
        { key: 'refundedAmount', label: 'Refunded Amount' },
      ],
    },
    {
      title: 'Invoice Status & Records',
      description: 'Track invoice statuses and maintain your invoice records',
      items: [
        { key: 'paid', label: 'Paid' },
        { key: 'refunded', label: 'Refunded' },
        { key: 'pending', label: 'Pending' },
        { key: 'completed', label: 'Completed' },
      ],
    },
  ];

  form: InvoiceForm = this.emptyForm();
  private saved: InvoiceForm = this.clone(this.form);

  constructor(private location: Location) {}

  ngOnInit(): void {
    // TODO: load saved invoice settings from API and assign to this.form / this.saved
    this.timers.push(setTimeout(() => (this.mounted = true), 30));
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  // ---------- helpers ----------
  private emptyForm(): InvoiceForm {
    return {
      builtIn: false,
      invoicePrefix: '',
      nextInvoiceNumber: '',
      creditNotePrefix: '',
      nextCreditNoteNumber: '',
      vatNumber: '',
      discountInvoice: false,
      logoOption: 'none',
      logoUrl: null,
      logoName: '',
      thankYou: '',
      taxMessage: '',
      texts: {},
    };
  }

  private clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v));
  }

  private later(fn: () => void, ms: number): void {
    this.timers.push(setTimeout(fn, ms));
  }

  // ---------- actions ----------
  goBack(): void {
    this.location.back();
  }

  save(): void {
    // TODO: call API with this.form
    this.saved = this.clone(this.form);
    this.showToast('Invoice settings saved');
  }

  cancel(): void {
    this.form = this.clone(this.saved);
    this.logoError = '';
    this.showToast('Changes discarded');
  }

  setTab(tab: TabId): void {
    this.activeTab = tab;
    this.previewMenuOpen = false;
  }

  toggleBuiltIn(): void {
    this.form.builtIn = !this.form.builtIn;
  }

  toggleDiscount(): void {
    this.form.discountInvoice = !this.form.discountInvoice;
  }

  setLogoOption(opt: 'none' | 'show'): void {
    this.form.logoOption = opt;
    this.logoError = '';
  }

  // ---------- inputs ----------
  onText(field: string, ev: Event): void {
    this.form[field] = (ev.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  onDigits(field: string, ev: Event): void {
    const el = ev.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, '').slice(0, 10);
    el.value = digits;
    this.form[field] = digits;
  }

  onTextItem(key: string, ev: Event): void {
    this.form.texts[key] = (ev.target as HTMLInputElement).value;
  }

  text(key: string): string {
    const custom = (this.form.texts[key] || '').trim();
    if (custom) return custom;
    for (const g of this.textGroups) {
      const item = g.items.find((i) => i.key === key);
      if (item) return item.label;
    }
    return '';
  }

  // ---------- logo upload (JPG / JPEG / PNG, max 5 MB) ----------
  onLogoSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const okType = ['image/jpeg', 'image/png'].includes(file.type);
    if (!okType) {
      this.logoError = 'Only JPG, JPEG or PNG files are allowed.';
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.logoError = 'Logo size must be 5 MB or less.';
      input.value = '';
      return;
    }

    this.logoError = '';
    const reader = new FileReader();
    reader.onload = () => {
      this.form.logoUrl = reader.result as string;
      this.form.logoName = file.name;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeLogo(): void {
    this.form.logoUrl = null;
    this.form.logoName = '';
  }

  // ---------- preview dropdown + modal ----------
  togglePreviewMenu(): void {
    this.previewMenuOpen = !this.previewMenuOpen;
  }

  @HostListener('document:click')
  closeMenuOnOutsideClick(): void {
    this.previewMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalOpen) this.closeModal();
    this.previewMenuOpen = false;
  }

  openModal(mode: ModalMode): void {
    this.previewMenuOpen = false;
    this.modalMode = mode;
    this.modalOpen = true;
    this.later(() => (this.modalVisible = true), 20);
  }

  closeModal(): void {
    this.modalVisible = false;
    this.later(() => (this.modalOpen = false), 300);
  }

  get modalTitle(): string {
    switch (this.modalMode) {
      case 'creditNote':
        return 'Credit note preview';
      case 'thankYou':
        return 'Thank you message preview';
      case 'tax':
        return 'Tax message preview';
      default:
        return 'Invoice preview';
    }
  }

  get previewNumber(): string {
    const isCredit = this.modalMode === 'creditNote';
    const prefix = isCredit ? this.form.creditNotePrefix : this.form.invoicePrefix;
    const next = isCredit ? this.form.nextCreditNoteNumber : this.form.nextInvoiceNumber;
    return `${prefix}${(next || '1').padStart(5, '0')}`;
  }

  // If a message is empty, nothing is shown for it in the preview
  get showThankYou(): boolean {
    return !!this.form.thankYou.trim() && (this.modalMode === 'invoice' || this.modalMode === 'creditNote' || this.modalMode === 'thankYou');
  }

  get showTaxMessage(): boolean {
    return !!this.form.taxMessage.trim() && (this.modalMode === 'invoice' || this.modalMode === 'creditNote' || this.modalMode === 'tax');
  }

  private showToast(msg: string): void {
    this.toast = msg;
    this.later(() => (this.toast = ''), 2200);
  }
}