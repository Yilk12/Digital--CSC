export type Article = {
  id: string
  title: string
  body: string
  url?: string
  tags?: string[]
  updatedAt?: string
}

export interface KnowledgeBaseProvider {
  search(params: { q: string; limit?: number; tags?: string[] }): Promise<{ items: Article[] }>
  get(id: string): Promise<Article | null>
}

class MockKB implements KnowledgeBaseProvider {
  private articles: Article[] = [
    { id: 'a1', title: 'How to handle customer complaints', body: 'Step-by-step playbook...', tags: ['complaints', 'csat'], updatedAt: new Date().toISOString() },
    { id: 'a2', title: 'Fleet maintenance checklist', body: 'Weekly and monthly checks...', tags: ['fleet', 'maintenance'], updatedAt: new Date().toISOString() },
    { id: 'a3', title: 'KPI breach runbook', body: 'Investigate data pipeline, alert owners...', tags: ['bsc', 'kpi'], updatedAt: new Date().toISOString() },
  ]
  async search({ q, limit = 10, tags = [] }: { q: string; limit?: number; tags?: string[] }) {
    const query = q.toLowerCase()
    let items = this.articles.filter(a => (a.title + ' ' + a.body).toLowerCase().includes(query))
    if (tags.length) items = items.filter(a => a.tags?.some(t => tags.includes(t)))
    return { items: items.slice(0, limit) }
  }
  async get(id: string) { return this.articles.find(a => a.id === id) || null }
}

let provider: KnowledgeBaseProvider | null = null
export function getKBProvider(): KnowledgeBaseProvider {
  if (!provider) {
    const name = process.env.KB_PROVIDER?.toLowerCase() || 'mock'
    switch (name) {
      default:
        provider = new MockKB()
    }
  }
  return provider
}
