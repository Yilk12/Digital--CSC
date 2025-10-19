export type AgentType = 'helpdesk' | 'kb'

export type DepartmentAgent = {
  id: string
  type: AgentType
  departmentId: string
  departmentName?: string
  name: string
  email?: string
  phone?: string
  tags?: string[]
  active?: boolean
  createdAt?: string
  updatedAt?: string
}

class AgentRegistry {
  private items: DepartmentAgent[] = [
    { id: 'a1', type: 'helpdesk', departmentId: 'HR', departmentName: 'Human Resources', name: 'HR Helpdesk Agent', email: 'hr-helpdesk@example.com', tags: ['hr','tickets'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'a2', type: 'kb', departmentId: 'FLEET', departmentName: 'Fleet', name: 'Fleet KB Agent', email: 'fleet-kb@example.com', tags: ['fleet','articles'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]

  list(params?: { type?: AgentType; departmentId?: string; q?: string }) {
    const { type, departmentId, q } = params || {}
    let items = this.items
    if (type) items = items.filter(i => i.type === type)
    if (departmentId) items = items.filter(i => i.departmentId === departmentId)
    if (q) {
      const s = q.toLowerCase()
      items = items.filter(i => [i.name, i.email, i.phone, i.departmentId, i.departmentName].filter(Boolean).join(' ').toLowerCase().includes(s))
    }
    return { items }
  }

  get(id: string) { return this.items.find(i => i.id === id) || null }

  create(data: Partial<DepartmentAgent>) {
    const id = `ag_${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()
    const item: DepartmentAgent = {
      id,
      type: (data.type as AgentType) || 'helpdesk',
      departmentId: data.departmentId || 'GENERAL',
      departmentName: data.departmentName || '',
      name: data.name || `Agent ${id}`,
      email: data.email,
      phone: data.phone,
      tags: data.tags || [],
      active: data.active ?? true,
      createdAt: now,
      updatedAt: now,
    }
    this.items.unshift(item)
    return item
  }

  update(id: string, updates: Partial<DepartmentAgent>) {
    const idx = this.items.findIndex(i => i.id === id)
    if (idx === -1) return null
    const updated = { ...this.items[idx], ...updates, updatedAt: new Date().toISOString() }
    this.items[idx] = updated
    return updated
  }

  delete(id: string) {
    const idx = this.items.findIndex(i => i.id === id)
    if (idx === -1) return false
    this.items.splice(idx, 1)
    return true
  }
}

let registry: AgentRegistry | null = null
export function getAgentRegistry() {
  if (!registry) registry = new AgentRegistry()
  return registry
}
