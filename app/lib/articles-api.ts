import { apiGet, apiPatch, apiPost } from "@/app/lib/api"
import { apiDelete } from "@/app/lib/api"

export type ArticleStatus = "DRAFT" | "REVIEW" | "PUBLISHED"
export type Language = "EN" | "AM" | "OR" | "TI" | "SO" | "SI" | "WO"

export interface ArticleSummary {
  id: string
  title: string
  titleAm?: string | null
  excerpt?: string | null
  language: Language
  status: ArticleStatus
  viewCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
  author: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
}

export interface ArticlesPage {
  articles: ArticleSummary[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ArticleComment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
}

export interface ArticleFeedback {
  id: string
  articleId: string
  userId: string
  isLike: boolean
  createdAt: string
}

export const articlesApi = {
  // GET /api/v1/knowledge-base/articles
  list: (params?: {
    page?: number
    limit?: number
    status?: ArticleStatus
    language?: Language
    categoryId?: string
    search?: string
    authorId?: string
  }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set("page", String(params.page))
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.status) q.set("status", params.status)
    if (params?.language) q.set("language", params.language)
    if (params?.categoryId) q.set("categoryId", params.categoryId)
    if (params?.search) q.set("search", params.search)
    if (params?.authorId) q.set("authorId", params.authorId)
    const qs = q.toString()
    return apiGet<ArticlesPage>(`/knowledge-base/articles${qs ? `?${qs}` : ""}`)
  },

  // GET /api/v1/knowledge-base/articles/:id
  getById: (id: string) => apiGet<ArticleSummary>(`/knowledge-base/articles/${id}`),

  // PATCH /api/v1/knowledge-base/articles/:id
  update: (id: string, dto: Partial<{ title: string; content: string; status: ArticleStatus; language: Language; expiresAt?: string | null }>) =>
    apiPatch<ArticleSummary>(`/knowledge-base/articles/${id}`, dto),

  // POST /api/v1/knowledge-base/articles/:id/feedback
  addFeedback: (id: string, isLike: boolean) =>
    apiPost<ArticleFeedback>(`/knowledge-base/articles/${id}/feedback`, { isLike }),

  // POST /api/v1/knowledge-base/articles/:id/comments
  addComment: (id: string, content: string) =>
    apiPost<ArticleComment>(`/knowledge-base/articles/${id}/comments`, { content }),

  // DELETE /api/v1/knowledge-base/articles/:id/comments/:commentId
  deleteComment: (id: string, commentId: string) =>
    apiDelete<{ success: boolean }>(`/knowledge-base/articles/${id}/comments/${commentId}`),

  // PATCH /api/v1/knowledge-base/articles/:id/comments/:commentId/hide
  hideComment: (id: string, commentId: string) =>
    apiPatch<ArticleComment>(`/knowledge-base/articles/${id}/comments/${commentId}/hide`, {}),

  // For create, prefer using multipart (ArticleForm already does direct fetch)
  // This is a convenience JSON create for simple cases without files
  createSimple: (dto: { title: string; content: string; status?: ArticleStatus; language?: Language }) =>
    apiPost<ArticleSummary>(`/knowledge-base/articles`, {
      ...dto,
      status: dto.status || "DRAFT",
      language: dto.language || "EN",
      anguage: dto.language || "AM",
    }),
}
