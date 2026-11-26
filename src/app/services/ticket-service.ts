import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ---------- MODEL ----------
export type TicketStatus = 'IN_PROGRESS' | 'AWAITING_REPLY' | 'RESOLVED';

export interface Ticket {
  id: number;
  subject: string;
  status: TicketStatus;
}

export interface SupportContact {
  enabled: boolean;
  available: boolean;
  phone: string | null;
  message?: string;
}

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  IN_PROGRESS: 'In-progress',
  AWAITING_REPLY: 'Awaiting your reply',
  RESOLVED: 'Resolved',
};

export const TICKET_STATUS_CLASS: Record<TicketStatus, string> = {
  IN_PROGRESS: 'bg-[#F5B83D] text-white',
  AWAITING_REPLY: 'bg-[#8B5CF6] text-white',
  RESOLVED: 'bg-[#62B9C4] text-white',
};

// ---------- SERVICE ----------
@Injectable({ providedIn: 'root' })
export class TicketService {
  private base = '/api/learner/support'; // unga backend URL ku maathunga

  constructor(private http: HttpClient) {}

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.base}/tickets`);
  }

  getSupportContact(): Observable<SupportContact> {
    return this.http.get<SupportContact>(`${this.base}/contact`);
  }

  createTicket(subject: string, description: string, file: File | null, clientRequestId: string): Observable<Ticket> {
    const fd = new FormData();
    fd.append('subject', subject.trim());
    fd.append('description', description.trim());
    fd.append('clientRequestId', clientRequestId);
    if (file) fd.append('file', file, file.name);
    return this.http.post<Ticket>(`${this.base}/tickets`, fd, {
      headers: { 'Idempotency-Key': clientRequestId },
    });
  }
}