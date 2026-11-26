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