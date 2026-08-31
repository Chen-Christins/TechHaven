export const TICKET_KINDS = ["requirement", "bug", "task"] as const;
export type TicketKind = (typeof TICKET_KINDS)[number];

export interface TicketRecord {
  id: number;
  kind: TicketKind;
  orgId: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketPage {
  total: number;
  page: number;
  pageSize: number;
  items: TicketRecord[];
}

export interface TrendSummary {
  orgId: number;
  days: number;
  byKind: Record<TicketKind, { open: number; closed: number; total: number }>;
  newlyCreated: number;
  newlyClosed: number;
}

export interface RequestIdentity {
  sessionId: string;
  orgId: number;
}

export interface TransitionInput extends RequestIdentity {
  kind: TicketKind;
  id: number;
  toStatus: string;
  reason: string;
  expectedFromStatus?: string;
  idempotencyKey: string;
}

export interface TransitionResult {
  ticket: TicketRecord;
  operation: {
    idempotencyKey: string;
    status: "confirmed";
    replayed: boolean;
    reconciled: boolean;
  };
}

export interface LegacyBackendPort {
  getTicket(orgId: number, kind: TicketKind, id: number): Promise<TicketRecord | null>;
  listTickets(orgId: number, opts: { kind?: TicketKind; status?: string; page?: number; pageSize?: number }): Promise<TicketPage>;
  searchRequirements(
    orgId: number,
    opts: { query?: string; priority?: string; page?: number; pageSize?: number },
  ): Promise<TicketPage>;
  getTrendSummary(orgId: number, days: number): Promise<TrendSummary>;
  updateTicketStatus(orgId: number, kind: TicketKind, id: number, toStatus: string, reason: string): Promise<void>;
}
