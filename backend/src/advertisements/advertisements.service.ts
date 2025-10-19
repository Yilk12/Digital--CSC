import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { CreateAdvertisementDto } from './dto/create-advertisement.dto'
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto'

export type Advertisement = {
  id: string
  title: string
  description: string
  category: string
  priority?: 'Low' | 'Medium' | 'High'
  publishDate?: string
  expiryDate?: string
  isPublished?: boolean
  isUrgent?: boolean
  attachments?: { id: string; name: string; url: string; type?: string; size?: number }[]
  createdAt: string
  updatedAt: string
  createdBy?: { id?: string; name?: string }
  likeCount?: number
  shareCount?: number
  comments?: Array<{ id: string; text: string; author?: string; createdAt: string }>
}

@Injectable()
export class AdvertisementsService {
  private readonly store = new Map<string, Advertisement>()

  list(params: { q?: string; category?: string; sort?: 'newest' | 'oldest'; page: number; pageSize: number }) {
    const all = Array.from(this.store.values())
      .filter((a) => {
        if (params.category && params.category !== 'All' && a.category !== params.category) return false
        if (params.q) {
          const s = params.q.toLowerCase()
          return a.title.toLowerCase().includes(s) || a.description.toLowerCase().includes(s)
        }
        return true
      })
      .sort((a, b) => {
        const da = new Date(a.createdAt).getTime()
        const db = new Date(b.createdAt).getTime()
        return (params.sort || 'newest') === 'newest' ? db - da : da - db
      })

    const start = (params.page - 1) * params.pageSize
    const items = all.slice(start, start + params.pageSize)
    return { items, total: all.length, page: params.page, pageSize: params.pageSize }
  }

  getOne(id: string) {
    const it = this.store.get(id)
    if (!it) throw new NotFoundException('Advertisement not found')
    return it
  }

  create(dto: CreateAdvertisementDto) {
    const now = new Date().toISOString()
    const ad: Advertisement = {
      id: randomUUID(),
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      publishDate: dto.publishDate,
      expiryDate: dto.expiryDate,
      isPublished: dto.isPublished ?? true,
      isUrgent: dto.isUrgent ?? false,
      attachments: [],
      createdAt: now,
      updatedAt: now,
      likeCount: 0,
      shareCount: 0,
      comments: [],
    }
    this.store.set(ad.id, ad)
    // Simple audit log stub
    console.log('[AUDIT] advertisement.create', { id: ad.id, title: ad.title })
    return ad
  }

  update(id: string, dto: UpdateAdvertisementDto) {
    const existing = this.getOne(id)
    const updated: Advertisement = {
      ...existing,
      ...dto,
      updatedAt: new Date().toISOString(),
    }
    this.store.set(id, updated)
    console.log('[AUDIT] advertisement.update', { id })
    return updated
  }

  remove(id: string) {
    const existed = this.store.delete(id)
    if (!existed) throw new NotFoundException('Advertisement not found')
    console.log('[AUDIT] advertisement.remove', { id })
    return { success: true }
  }

  addAttachments(id: string, files: Express.Multer.File[]) {
    const ad = this.getOne(id)
    const next = files.map((f) => ({
      id: randomUUID(),
      name: f.originalname,
      url: `/uploads/${f.filename || f.originalname}`,
      type: f.mimetype,
      size: f.size,
    }))
    ad.attachments = [...(ad.attachments || []), ...next]
    ad.updatedAt = new Date().toISOString()
    this.store.set(id, ad)
    console.log('[AUDIT] advertisement.attachments', { id, files: files.length })
    return ad
  }

  like(id: string) {
    const ad = this.getOne(id)
    ad.likeCount = (ad.likeCount || 0) + 1
    ad.updatedAt = new Date().toISOString()
    this.store.set(id, ad)
    console.log('[AUDIT] advertisement.like', { id, likeCount: ad.likeCount })
    return ad
  }

  share(id: string) {
    const ad = this.getOne(id)
    ad.shareCount = (ad.shareCount || 0) + 1
    ad.updatedAt = new Date().toISOString()
    this.store.set(id, ad)
    console.log('[AUDIT] advertisement.share', { id, shareCount: ad.shareCount })
    return ad
  }

  listComments(id: string, page = 1, pageSize = 10) {
    const ad = this.getOne(id)
    const all = ad.comments || []
    const start = (Number(page) - 1) * Number(pageSize)
    const items = all.slice(start, start + Number(pageSize))
    return { items, total: all.length, page: Number(page), pageSize: Number(pageSize) }
  }

  addComment(id: string, text: string, author?: string) {
    if (!text || !text.trim()) throw new NotFoundException('Comment text required')
    const ad = this.getOne(id)
    const comment = { id: randomUUID(), text: text.trim(), author, createdAt: new Date().toISOString() }
    ad.comments = [...(ad.comments || []), comment]
    ad.updatedAt = new Date().toISOString()
    this.store.set(id, ad)
    console.log('[AUDIT] advertisement.comment.add', { id, commentId: comment.id })
    return comment
  }

  updateComment(id: string, commentId: string, text: string) {
    const ad = this.getOne(id)
    const list = ad.comments || []
    const idx = list.findIndex(c => c.id === commentId)
    if (idx === -1) throw new NotFoundException('Comment not found')
    if (!text || !text.trim()) throw new NotFoundException('Comment text required')
    list[idx] = { ...list[idx], text: text.trim() }
    ad.comments = list
    ad.updatedAt = new Date().toISOString()
    this.store.set(id, ad)
    console.log('[AUDIT] advertisement.comment.update', { id, commentId })
    return list[idx]
  }

  deleteComment(id: string, commentId: string) {
    const ad = this.getOne(id)
    const list = ad.comments || []
    const idx = list.findIndex(c => c.id === commentId)
    if (idx === -1) throw new NotFoundException('Comment not found')
    list.splice(idx, 1)
    ad.comments = list
    ad.updatedAt = new Date().toISOString()
    this.store.set(id, ad)
    console.log('[AUDIT] advertisement.comment.delete', { id, commentId })
    return { success: true }
  }
}

