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

class NoopKB implements KnowledgeBaseProvider {
  async search(): Promise<{ items: Article[] }> { return { items: [] } }
  async get(): Promise<Article | null> { return null }
}

let provider: KnowledgeBaseProvider | null = null
export function getKBProvider(): KnowledgeBaseProvider {
  if (!provider) {
    const name = process.env.KB_PROVIDER?.toLowerCase() || 'none'
    switch (name) {
      default:
        provider = new NoopKB()
    }
  }
  return provider
}
