import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  SupportContact,
  Ticket,
  TicketService,
  TICKET_STATUS_CLASS,
  TICKET_STATUS_LABEL,
} from '../../services/ticket-service';

// ---------- VALIDATION ----------
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

function textLength(min: number, max: number, required: string, minMsg: string, maxMsg: string): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const v = (c.value ?? '').toString().trim();
    if (!v.length) return { message: required };
    if (v.length < min) return { message: minMsg };
    if (v.length > max) return { message: maxMsg };
    return null;
  };
}

// ---------- COMPONENT ----------
@Component({
  selector: 'app-technical-support',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './technical-support-learner.html',
})
export class TechnicalSupportComponent implements OnInit {
  readonly statusLabel = TICKET_STATUS_LABEL;
  readonly statusClass = TICKET_STATUS_CLASS;

  activeTab: 'tickets' | 'contact' = 'tickets';
  view: 'list' | 'form' = 'list';

  tickets: Ticket[] = [];
  loadingTickets = false;
  loadError = '';

  contact: SupportContact | null = null;

  form: FormGroup;
  file: File | null = null;
  fileError = '';
  isDragging = false;

  isSubmitting = false;
  submitError = '';
  successMsg = '';
  private clientRequestId = this.newId();

  constructor(private fb: FormBuilder, private api: TicketService, private router: Router) {
    this.form = this.fb.group({
      subject: ['', textLength(3, 100, 'Please enter a subject.',
        'Subject must contain at least 3 characters', 'Subject cannot exceed 100 characters')],
      description: ['', textLength(10, 1000, 'Please describe your issue.',
        'Description must contain at least 10 characters.', 'Description cannot exceed 1,000 characters.')],
    });
  }

  ngOnInit(): void {
    this.loadTickets();
    this.loadContact();
  }

  // ---------- data ----------
  loadTickets(): void {
    this.loadingTickets = true;
    this.loadError = '';
    this.api.getTickets().pipe(finalize(() => (this.loadingTickets = false))).subscribe({
      next: (t: Ticket[]) => (this.tickets = t),
      error: (e: HttpErrorResponse) => this.handleHttpError(e, 'load'),
    });
  }

  loadContact(): void {
    this.api.getSupportContact().subscribe({
      next: (c: SupportContact) => {
        this.contact = c;
        if (!c.enabled && this.activeTab === 'contact') this.activeTab = 'tickets';
      },
      error: () => (this.contact = { enabled: false, available: false, phone: null }),
    });
  }

  // ---------- tabs / navigation ----------
  selectTab(tab: 'tickets' | 'contact'): void {
  if (tab === 'contact') this.loadContact();
  this.activeTab = tab;
  this.view = 'list';
  this.successMsg = '';
}

  openForm(): void {
    this.view = 'form';
    this.submitError = '';
    this.successMsg = '';
  }

   close(): void {
    this.router.navigate(['/admin-dashboard/learner-dashboard-home']);
  }

  cancelForm(): void {
    if (this.isSubmitting) return;
    this.resetForm();
    this.view = 'list';
  }

  // ---------- file upload ----------
  onFileInput(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.setFile(input.files?.[0] ?? null);
    input.value = '';
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.isDragging = false;
    this.setFile(ev.dataTransfer?.files?.[0] ?? null);
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    this.isDragging = true;
  }

  private setFile(f: File | null): void {
    this.fileError = '';
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXT.includes(ext) || (f.type && !ALLOWED_TYPES.includes(f.type))) {
      this.file = null;
      this.fileError = 'Unsupported file format.';
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      this.file = null;
      this.fileError = 'File size exceeds the allowed limit.';
      return;
    }
    this.file = f;
  }

  removeFile(): void {
    this.file = null;
    this.fileError = '';
  }

  // ---------- submit ----------
  submit(): void {
    if (this.isSubmitting) return;
    this.submitError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitError = 'Please complete all mandatory fields before submitting.';
      return;
    }

    this.isSubmitting = true;
    const { subject, description } = this.form.value;

    this.api.createTicket(subject, description, this.file, this.clientRequestId)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.successMsg = 'Your ticket has been submitted successfully. Please check your email for the reply.';
          this.resetForm();
          this.view = 'list';
          this.loadTickets();
          setTimeout(() => (this.successMsg = ''), 6000);
        },
        error: (e: HttpErrorResponse) => this.handleHttpError(e, 'submit'),
      });
  }

  // ---------- call ----------
  callNow(): void {
    this.api.getSupportContact().subscribe({
      next: (c: SupportContact) => {
        this.contact = c;
        if (c.enabled && c.available && c.phone) {
          window.location.href = `tel:${c.phone}`;
        } else if (!c.enabled) {
          this.activeTab = 'tickets';
        }
      },
      error: () => {},
    });
  }

  // ---------- helpers ----------

  /** Which panel is currently visible (drives the CSS transitions in the template). */
  get state(): 'list' | 'form' | 'contact' {
  if (this.activeTab === 'contact') return 'contact';
  return this.view;
}
  err(name: 'subject' | 'description'): string {
    const c = this.form.get(name)!;
    return c.touched && c.errors ? c.errors['message'] : '';
  }

  get descLength(): number {
    return (this.form.get('description')?.value ?? '').length;
  }

  trackById(_: number, t: Ticket): number {
    return t.id;
  }

  private resetForm(): void {
    this.form.reset({ subject: '', description: '' });
    this.file = null;
    this.fileError = '';
    this.submitError = '';
    this.clientRequestId = this.newId();
  }

  private newId(): string {
    return (crypto as any).randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private handleHttpError(e: HttpErrorResponse, ctx: 'load' | 'submit'): void {
    let msg: string;
    if (e.status === 0) msg = 'No internet connection. Please check your network and try again.';
    else if (e.status === 401) { this.router.navigate(['/login']); return; }
    else if (e.status === 413) msg = 'File size exceeds the allowed limit.';
    else if (e.status === 415) msg = 'Unsupported file format.';
    else if (e.status === 422) msg = e.error?.message || 'Please check the details and try again.';
    else msg = 'Something went wrong on our side. Please try again.';

    if (ctx === 'load') this.loadError = msg;
    else this.submitError = msg;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(ev: BeforeUnloadEvent): void {
    if (this.isSubmitting) {
      ev.preventDefault();
      ev.returnValue = '';
    }
  }
}