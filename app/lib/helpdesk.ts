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

class MockHelpDesk implements HelpDeskProvider {
  private tickets: Ticket[] = [
    { id: 't1', subject: 'Sample ticket', description: 'Demo ticket', priority: 'medium', status: 'open', requesterId: 'u1', tags: ['demo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), externalRef: null },
  ]
  private comments: TicketComment[] = []

  async listTickets({ q = '', status, requesterId, limit = 50 }: { q?: string; status?: string; requesterId?: string; limit?: number }) {
    let items = this.tickets
    if (q) items = items.filter(t => (t.subject + ' ' + t.description).toLowerCase().includes(q.toLowerCase()))
    if (status) items = items.filter(t => t.status === status)
    if (requesterId) items = items.filter(t => t.requesterId === requesterId)
    return { items: items.slice(0, limit) }
  }
  async getTicket(id: string) { return this.tickets.find(t => t.id === id) || null }
  async createTicket(data: Partial<Ticket>) {
    const id = `t${this.tickets.length + 1}`
    const now = new Date().toISOString()
    const item: Ticket = {
      id,
      subject: data.subject || `Ticket ${id}`,
      description: data.description || '',
      priority: data.priority || 'medium',
      status: data.status || 'new',
      requesterId: data.requesterId || null,
      assigneeId: data.assigneeId || null,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
      externalRef: null,
    }
    this.tickets.unshift(item)
    return item
  }
  async updateTicket(id: string, updates: Partial<Ticket>) {
    const idx = this.tickets.findIndex(t => t.id === id)
    if (idx === -1) throw new Error('not found')
    const updated = { ...this.tickets[idx], ...updates, updatedAt: new Date().toISOString() }
    this.tickets[idx] = updated
    return updated
  }
  async addComment({ ticketId, body, authorId = null }: { ticketId: string; body: string; authorId?: string | null }) {
    const id = `c${this.comments.length + 1}`
    const item: TicketComment = { id, ticketId, body, authorId, createdAt: new Date().toISOString() }
    this.comments.push(item)
    return item
  }
}

let provider: HelpDeskProvider | null = null

export function getHelpDeskProvider(): HelpDeskProvider {
  if (!provider) {
    const name = process.env.HELPDESK_PROVIDER?.toLowerCase() || 'mock'
    switch (name) {
      // Here we can add: 'zendesk', 'freshdesk', 'servicenow' implementations
      default:
        provider = new MockHelpDesk()
    }
  }
  return provider
}
