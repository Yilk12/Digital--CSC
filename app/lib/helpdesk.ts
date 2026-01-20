export type Ticket = {
  id: string
  subject: string
  description: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'new' | 'open' | 'pending' | 'on_hold' | 'solved' | 'closed'
  requesterId?: string | null
  assigneeId?: string | null
  tags?: string[]
  createdAt?: string
  updatedAt?: string
  externalRef?: string | null
}

export type TicketComment = {
  id: string
  ticketId: string
  body: string
  authorId?: string | null
  createdAt?: string
}

export interface HelpDeskProvider {
  listTickets(params: { q?: string; status?: string; requesterId?: string; limit?: number }): Promise<{ items: Ticket[] }>
  getTicket(id: string): Promise<Ticket | null>
  createTicket(data: Partial<Ticket>): Promise<Ticket>
  updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket>
  addComment(data: { ticketId: string; body: string; authorId?: string | null }): Promise<TicketComment>
}

class NoopHelpDesk implements HelpDeskProvider {
  async listTickets(): Promise<{ items: Ticket[] }> {
    return { items: [] }
  }
  async getTicket(): Promise<Ticket | null> {
    return null
  }
  async createTicket(): Promise<Ticket> {
    throw new Error('HelpDesk provider is not configured')
  }
  async updateTicket(): Promise<Ticket> {
    throw new Error('HelpDesk provider is not configured')
  }
  async addComment(): Promise<TicketComment> {
    throw new Error('HelpDesk provider is not configured')
  }
}

let provider: HelpDeskProvider | null = null

export function getHelpDeskProvider(): HelpDeskProvider {
  if (!provider) {
    const name = process.env.HELPDESK_PROVIDER?.toLowerCase() || 'none'
    switch (name) {
      // Here we can add: 'zendesk', 'freshdesk', 'servicenow' implementations
      default:
        provider = new NoopHelpDesk()
    }
  }
  return provider
}
