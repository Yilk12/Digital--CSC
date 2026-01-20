"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLocalization } from "@/app/hooks/use-localization"
import { getCurrentUserRoles } from "@/app/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import {
  BookOpen,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Star,
  TrendingUp,
  Filter,
  Globe,
  Calendar,
  User,
  Share2,
  MessageSquare,
  Paperclip,
} from "lucide-react"
import ArticleForm from "./article-form"
import { ArticleViewer } from "./article-viewer"
import { apiGet } from "@/app/lib/api"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/app/components/ui/sheet"
import { useToast } from "@/app/components/toast-provider"
import { articlesApi } from "@/app/lib/articles-api"

interface Article {
  id: string
  title: string
  titleAm?: string
  content: string
  contentAm?: string
  category?: string
  categoryId?: string
  tags?: string[]
  author?: string
  status: "Draft" | "Review" | "Published" | "Archived"
  language: "en" | "am" | "both"
  views: number
  likes: number
  dislikes: number
  commentCount?: number
  rating: number
  createdAt: string
  updatedAt: string
  publishedAt?: string
  expiryDate?: string
  attachments?: { id: string; filename: string }[]
}

interface ArticleCommentPreview {
  id: string
  author: string
  content: string
  createdAt: string
}

interface Category {
  id: string
  name: string
  nameAm?: string
  description?: string
  descriptionAm?: string
}

const defaultCategories = [
  { value: "authentication", label: "Authentication", labelAm: "ማረጋገጫ" },
  { value: "technical-support", label: "Technical Support", labelAm: "ቴክኒካል ድጋፍ" },
  { value: "user-guide", label: "User Guide", labelAm: "የተጠቃሚ መመሪያ" },
  { value: "policies", label: "Policies", labelAm: "ፖሊሲዎች" },
  { value: "procedures", label: "Procedures", labelAm: "ሂደቶች" },
  { value: "faq", label: "FAQ", labelAm: "ተደጋጋሚ ጥያቄዎች" },
  { value: "information", label: "Information", labelAm: "መረጃ" },
  { value: "advice", label: "Advice", labelAm: "ምክር" },
  { value: "improvement", label: "Improvement", labelAm: "ማሻሻያ" },
  { value: "practice", label: "Practice", labelAm: "ልምድ" },
  { value: "institutional-rules", label: "የተቋሙ ህጎች", labelAm: "የተቋሙ ህጎች" },
  { value: "technology", label: "Technology", labelAm: "ቴክኖሎጂ" },
]

export function KnowledgeBase() {
  const { currentLanguage, t } = useLocalization()
  const { show: toast } = useToast()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "like" | "dislike" | null>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [loadingData, setLoadingData] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [languageFilter, setLanguageFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewerDialog, setShowViewerDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [commentArticle, setCommentArticle] = useState<Article | null>(null)
  const [commentText, setCommentText] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentList, setCommentList] = useState<ArticleCommentPreview[]>([])
  const [commentListLoading, setCommentListLoading] = useState(false)
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 5

  // Set mounted state and check admin status on client side only
  useEffect(() => {
    setMounted(true)
    const roles = getCurrentUserRoles().map(r => r.toLowerCase())
    setIsAdmin(roles.includes("admin") || roles.includes("system_admin") || roles.includes("general director"))
  }, [])

  // Load categories
  useEffect(() => {
    let active = true;
    
    async function loadCategories() {
      setLoadingData(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") ||
              localStorage.getItem("jwt") ||
              localStorage.getItem("token")
            : null;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-base/categories`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to load categories: ${response.statusText}`);
        }

        const data = await response.json();

        if (active) {
          // Handle different possible response structures
          setCategories(data.categories || data || []);
        }
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load categories");
      } finally {
        if (active) setLoadingData(false);
      }
    }

    loadCategories();

    
    return () => { active = false; };
  }, [])

  const handleFeedback = async (articleId: string, isLike: boolean) => {
    const current = feedbackMap[articleId] || null

    // If user clicks the same button again, do nothing
    if ((isLike && current === "like") || (!isLike && current === "dislike")) {
      return
    }

    try {
      await articlesApi.addFeedback(articleId, isLike)

      setArticles((prev) =>
        prev.map((a) => {
          if (a.id !== articleId) return a
          let likes = a.likes
          let dislikes = a.dislikes

          // Remove previous feedback from this user in UI
          if (current === "like") likes = Math.max(0, likes - 1)
          if (current === "dislike") dislikes = Math.max(0, dislikes - 1)

          // Apply new feedback
          if (isLike) likes += 1
          else dislikes += 1

          return { ...a, likes, dislikes }
        }),
      )

      setFeedbackMap((prev) => ({
        ...prev,
        [articleId]: isLike ? "like" : "dislike",
      }))

      toast({
        variant: "success",
        title:
          currentLanguage === "am"
            ? isLike
              ? "ያስደሰተኝ ብለዋል"
              : "አልወደድኩትም ብለዋል"
            : isLike
              ? "Marked as helpful"
              : "Marked as not helpful",
      })
    } catch (err: any) {
      console.error("Failed to send feedback", err)
      toast({
        variant: "destructive",
        title: currentLanguage === "am" ? "ግብረ መልስ መላክ አልተሳካም" : "Failed to send feedback",
        description: typeof err?.message === "string" ? err.message : undefined,
      })
    }
  }

  const openCommentDialog = (article: Article) => {
    setCommentArticle(article)
    setCommentText("")
    setCommentList([])
    setCommentDialogOpen(true)
    loadComments(article.id)
  }

  const submitComment = async () => {
    const content = commentText.trim()
    if (!content || !commentArticle) return

    try {
      setCommentLoading(true)
      const created: any = await articlesApi.addComment(commentArticle.id, content)

      // Optimistically increment comment count on the corresponding card
      setArticles((prev) =>
        prev.map((a) =>
          a.id === commentArticle.id
            ? { ...a, commentCount: (a.commentCount ?? 0) + 1 }
            : a,
        ),
      )

      if (created) {
        const authorName = created.author
          ? `${created.author.firstName} ${created.author.lastName}`.trim() || "Unknown user"
          : "Unknown user"

        const preview: ArticleCommentPreview = {
          id: created.id,
          author: authorName,
          content: created.content,
          createdAt: created.createdAt,
        }

        setCommentList((prev) => [preview, ...prev])
      }

      toast({
        variant: "success",
        title:
          currentLanguage === "am"
            ? "አስተያየት ተለጥፏል"
            : "Comment posted",
      })

      setCommentDialogOpen(false)
      setCommentArticle(null)
      setCommentText("")
    } catch (err: any) {
      console.error("Failed to post comment", err)
      toast({
        variant: "destructive",
        title:
          currentLanguage === "am"
            ? "አስተያየት መለጠፍ አልተሳካም"
            : "Failed to post comment",
        description: typeof err?.message === "string" ? err.message : undefined,
      })
    } finally {
      setCommentLoading(false)
    }
  }

  const loadComments = async (articleId: string) => {
    try {
      setCommentListLoading(true)
      setCommentList([])
      const data: any = await apiGet<any>(`/knowledge-base/articles/${articleId}`)
      const comments = Array.isArray(data?.comments) ? data.comments : []
      const mapped: ArticleCommentPreview[] = comments.map((c: any) => {
        const authorName = c.author
          ? `${c.author.firstName} ${c.author.lastName}`.trim() || "Unknown user"
          : "Unknown user"
        return {
          id: c.id,
          author: authorName,
          content: c.content,
          createdAt: c.createdAt,
        }
      })
      setCommentList(mapped)
    } catch (err: any) {
      console.error("Failed to load comments", err)
      toast({
        variant: "destructive",
        title: currentLanguage === "am" ? "አስተያየቶች መመልከት አልተሳካም" : "Failed to load comments",
        description: typeof err?.message === "string" ? err.message : undefined,
      })
    } finally {
      setCommentListLoading(false)
    }
  }

  const handleShare = async (article: Article) => {
    try {
      const url = `${window.location.origin}/knowledge-base/articles/${article.id}`

      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: currentLanguage === "am" ? "የእውቀት ቤት ጽሁፍ" : "Knowledge base article",
          url,
        })
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
      }

      toast({
        variant: "success",
        title: currentLanguage === "am" ? "ሊንኩ ተቀድቶአል" : "Link ready to share",
      })
    } catch (err: any) {
      console.error("Failed to share article", err)
      toast({
        variant: "destructive",
        title: currentLanguage === "am" ? "ሊንክ መካፈል አልተሳካም" : "Failed to share link",
        description: typeof err?.message === "string" ? err.message : undefined,
      })
    }
  }

  // Load articles with category filter
  useEffect(() => {
    let active = true
    async function loadArticles() {
      setLoading(true)
      setError(null)
      try {
        // Build query parameters
        const params = new URLSearchParams()
        params.append('limit', '50')
        
        if (categoryFilter && categoryFilter !== 'all') {
          params.append('categoryId', categoryFilter)
        }
        
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter.toUpperCase())
        } else {
          // Default to published articles for non-admin users
          if (!isAdmin) {
            params.append('status', 'PUBLISHED')
          }
        }

        const queryString = params.toString()
        const url = `/knowledge-base/articles${queryString ? `?${queryString}` : ''}`
        
        const data = await apiGet<{ articles: any[] }>(url)
        
        const mapped: Article[] = (data?.articles || []).map((a) => ({
          id: a.id,
          title: a.title,
          titleAm: a.titleAm || undefined,
          content: a.content,
          contentAm: a.contentAm || undefined,
          categoryId: a.categoryId,
          tags: a.tags || undefined,
          author: a.author || undefined,
          status: String(a.status).toUpperCase() === "PUBLISHED" ? "Published" : 
                  String(a.status).toUpperCase() === "REVIEW" ? "Review" : 
                  String(a.status).toUpperCase() === "ARCHIVED" ? "Archived" : "Draft",
          language: String(a.language).toUpperCase() === "AM" ? "am" : 
                   String(a.language).toUpperCase() === "BOTH" ? "both" : "en",
          views: a.viewCount ?? 0,
          likes: a.likeCount ?? 0,
          dislikes: a.dislikeCount ?? 0,
          commentCount: (a as any)?._count?.comments ?? 0,
          rating: a.rating ?? 0,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          publishedAt: a.publishedAt || undefined,
          expiryDate: a.expiresAt || undefined,
          attachments: Array.isArray((a as any).attachments)
            ? (a as any).attachments.map((att: any) => ({
                id: att.id,
                filename: att.filename || att.originalName || "Attachment",
              }))
            : undefined,
        }))
        if (active) setArticles(mapped)
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load articles")
      } finally {
        if (active) setLoading(false)
      }
    }
    loadArticles()
    return () => { active = false }
  }, [categoryFilter, statusFilter, isAdmin, reloadKey])

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    if (!categoryId) return ''
    const category = categories.find(cat => cat.id === categoryId)
    return category ? (currentLanguage === 'am' && category.nameAm ? category.nameAm : category.name) : ''
  }

  // Filter articles based on search term and other filters
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      searchTerm === '' ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.titleAm && article.titleAm.includes(searchTerm)) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.contentAm && article.contentAm.includes(searchTerm)) ||
      (article.tags ? article.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())) : false)

    const matchesLanguage =
      languageFilter === "all" || article.language === languageFilter || article.language === "both"

    return matchesSearch && matchesLanguage
  })

  // Reset to first page when filters or search change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, categoryFilter, statusFilter, languageFilter])

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + pageSize)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "default"
      case "Draft":
        return "secondary"
      case "Review":
        return "outline"
      case "Archived":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    if (Number.isNaN(diffMs)) return dateString

    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))
    const daysTotal = Math.floor(totalSeconds / 86400)
    const years = Math.floor(daysTotal / 365)
    const daysAfterYears = daysTotal % 365
    const months = Math.floor(daysAfterYears / 30)
    const days = daysAfterYears % 30
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (years > 0) {
      const m = months > 0 ? `${months}month` : ""
      return `${years}year${years > 1 ? "s" : ""}${m ? ` ${m}${months > 1 ? "s" : ""}` : ""} ago`
    }

    if (months > 0) {
      const d = days > 0 ? `${days}d` : ""
      return `${months}month${months > 1 ? "s" : ""}${d ? ` ${d}` : ""} ago`
    }

    if (days > 0) {
      const h = hours > 0 ? `${hours}h` : ""
      return `${days}d${h ? ` ${h}` : ""} ago`
    }

    if (hours > 0) {
      const m = minutes > 0 ? `${minutes}m` : ""
      return `${hours}h${m ? ` ${m}` : ""} ago`
    }

    if (minutes > 0) {
      const s = seconds > 0 ? `${seconds}s` : ""
      return `${minutes}m${s ? ` ${s}` : ""} ago`
    }

    return `${seconds}s ago`
  }

  const getKBStats = () => {
    const total = articles.length
    const published = articles.filter((a) => a.status === "Published").length
    const totalViews = articles.reduce((sum, a) => sum + a.views, 0)
    const avgRating = articles.length > 0 ? articles.reduce((sum, a) => sum + a.rating, 0) / articles.length : 0

    return { total, published, totalViews, avgRating }
  }

  const stats = getKBStats()

  const popularArticles = [...articles]
    .filter((a) => a.status === "Published")
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  // Don't render admin-specific content until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary font-[family-name:var(--font-playfair)]">
              {t("kb.header")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("kb.subtitle")}
            </p>
          </div>
          <Button className="gap-2 opacity-50" disabled>
            <Plus className="w-4 h-4" />
            {t("kb.new_article")}
          </Button>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-lg">{t("common.loading")}</span>
        </div>
      </div>
    )
  }

  const deleteArticle = async (id: string) => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("token")
          : null

      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-base/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        throw new Error(text || `Failed to delete: ${resp.status}`)
      }

      setArticles(prev => prev.filter(a => a.id !== id))
      setArticleToDelete(null)
      setDeleteSheetOpen(false)
    } catch (e: any) {
      console.error('Delete failed', e)
      // You may replace with toast if desired
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary font-[family-name:var(--font-playfair)]">{t("kb.header")}</h1>
          <p className="text-muted-foreground mt-2">{t("kb.subtitle")}</p>
        </div>

        {isAdmin && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t("kb.new_article")}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full sm:max-w-5xl h-[90vh] max-h-none p-4 sm:p-8 overflow-auto">
              <DialogHeader>
                <DialogTitle>{t("kb.create_title")}</DialogTitle>
              </DialogHeader>
              <ArticleForm 
                mode="create" 
                onCancel={() => setShowCreateDialog(false)} 
                onSubmit={() => {
                  setShowCreateDialog(false)
                  setReloadKey((k) => k + 1)
                }} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {t("kb.search_filters")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("kb.search_placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder={
                        categoriesLoading ? t("kb.loading_categories") : t("kb.all_categories")
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("kb.all_categories")}</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {currentLanguage === "am" ? (cat.nameAm || cat.name) : cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder={t("kb.all_status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("kb.all_status")}</SelectItem>
                      <SelectItem value="Published">{t("kb.status.published")}</SelectItem>
                      {isAdmin && (
                        <>
                          <SelectItem value="Draft">{t("kb.status.draft")}</SelectItem>
                          <SelectItem value="Review">{t("kb.status.review")}</SelectItem>
                          <SelectItem value="Archived">{t("kb.status.archived")}</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>

                  <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder={t("kb.all_languages")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("kb.all_languages")}</SelectItem>
                      <SelectItem value="en">{t("kb.lang.english")}</SelectItem>
                      <SelectItem value="am">{t("kb.lang.amharic")}</SelectItem>
                      <SelectItem value="both">{t("kb.lang.both")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Articles List */}
          <div className="space-y-4">
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-3 text-sm text-muted-foreground">
                  {t("kb.loading_articles")}
                </span>
              </div>
            )}
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            
            {!loading && !error && filteredArticles.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>
                  {t("kb.no_articles")}
                </p>
              </div>
            )}

            {!loading && paginatedArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        {article.categoryId && (
                          <Badge variant="outline">
                            {getCategoryName(article.categoryId)}
                          </Badge>
                        )}
                        {article.language === "both" && (
                          <Badge variant="secondary" className="gap-1">
                            <Globe className="w-3 h-3" />
                            {t("kb.bilingual")}
                          </Badge>
                        )}
                        {article.language === "am" && (
                          <Badge variant="secondary">
                            {t("kb.lang.amharic")}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg">
                          {currentLanguage === "am" && article.titleAm ? article.titleAm : article.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                          {currentLanguage === "am" && article.contentAm
                            ? article.contentAm.substring(0, 150) + "..."
                            : article.content.substring(0, 150) + "..."}
                        </p>
                      </div>

                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {article.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {Array.isArray(article.attachments) && article.attachments.length > 0 && (
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-blue-700"
                          onClick={() => {
                            setSelectedArticle(article)
                            setShowViewerDialog(true)
                          }}
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>{article.attachments.length}</span>
                          <span>attachment{article.attachments.length > 1 ? "s" : ""}</span>
                        </button>
                      )}

                      {/* More button to view full article details (navigate to details page) */}
                      <div className="pt-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="px-0 h-auto font-normal text-blue-700 hover:text-blue-900 hover:underline"
                          onClick={() => {
                            router.push(`/knowledge-base/details?articleId=${article.id}`)
                          }}
                        >
                          {currentLanguage === "am" ? "More" : "More"}
                        </Button>
                      </div>

                      {/* Meta row: date, views, feedback, share, comments */}
                      <div className="mt-2 flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                        {article.author && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {article.author}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(article.updatedAt)}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-blue-600" />
                            {article.views}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`flex items-center gap-1 px-2 ${feedbackMap[article.id] === "like" ? "text-green-700 font-semibold" : "text-green-600"}`}
                            onClick={() => handleFeedback(article.id, true)}
                            disabled={feedbackMap[article.id] === "like"}
                            title={currentLanguage === "am" ? "ጽሁፉ ጠቃሚ ነው" : "This article is helpful"}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            {article.likes}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`flex items-center gap-1 px-2 ${feedbackMap[article.id] === "dislike" ? "text-red-700 font-semibold" : "text-red-600"}`}
                            onClick={() => handleFeedback(article.id, false)}
                            disabled={feedbackMap[article.id] === "dislike"}
                            title={currentLanguage === "am" ? "ጽሁፉ አልረዳኝም" : "This article is not helpful"}
                          >
                            <ThumbsDown className="w-4 h-4" />
                            {article.dislikes}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 px-2"
                            onClick={() => handleShare(article)}
                            title={currentLanguage === "am" ? "ጽሁፉን አጋራ" : "Share article"}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 px-2"
                            onClick={() => {
                              setSelectedArticle(article)
                              setShowViewerDialog(true)
                            }}
                            title={currentLanguage === "am" ? "አስተያየቶችን ይመልከቱ" : "View comments and details"}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{article.commentCount ?? 0}</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {isAdmin && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            title={t("kb.edit_article")}
                            onClick={() => {
                              setSelectedArticle(article)
                              setShowEditDialog(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive bg-transparent"
                            title={t("kb.delete_article")}
                            onClick={() => {
                              setArticleToDelete(article)
                              setDeleteSheetOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination controls */}
            {!loading && !error && filteredArticles.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Article Viewer Dialog (full-screen overlay with centered content column) */}
      <Dialog open={showViewerDialog} onOpenChange={setShowViewerDialog}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 sm:p-4 overflow-y-auto overflow-x-hidden bg-white">
          {selectedArticle && (
            <ArticleViewer 
              article={selectedArticle} 
              onClose={() => setShowViewerDialog(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentLanguage === "am" ? "አዲስ አስተያየት" : "Add Comment"}
            </DialogTitle>
            <DialogDescription>
              {currentLanguage === "am"
                ? commentArticle?.titleAm || commentArticle?.title
                : commentArticle?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              rows={1}
              className="w-full min-h-[40px] max-h-[40px] resize-none break-words"
              value={commentText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentText(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  submitComment()
                }
              }}
              placeholder={currentLanguage === "am" ? "አስተያየትዎን ያስገቡ..." : "Write your comment..."}
            />
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2 bg-muted/40">
              {commentListLoading && (
                <div className="text-sm text-muted-foreground">
                  {currentLanguage === "am" ? "አስተያየቶች በመጫን ላይ..." : "Loading comments..."}
                </div>
              )}
              {!commentListLoading && commentList.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {currentLanguage === "am" ? "አስተያየት የለም።" : "No comments yet."}
                </div>
              )}
              {!commentListLoading && commentList.length > 0 && (
                <div className="space-y-3">
                  {commentList.map((c) => (
                    <div key={c.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-medium text-foreground">{c.author}</span>
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCommentDialogOpen(false)
                  setCommentArticle(null)
                  setCommentText("")
                }}
                disabled={commentLoading}
              >
                {currentLanguage === "am" ? "መሰረዝ" : "Cancel"}
              </Button>
              <Button onClick={submitComment} disabled={commentLoading || !commentText.trim()}>
                {commentLoading
                  ? currentLanguage === "am" ? "በመላክ ላይ..." : "Posting..."
                  : currentLanguage === "am" ? "አስተያየት ላክ" : "Post Comment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none p-4 sm:p-8 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("kb.edit_article")}</DialogTitle>
          </DialogHeader>
          {selectedArticle && (
            <ArticleForm
              mode="edit"
              article={{
                id: selectedArticle.id,
                title: selectedArticle.title,
                titleAm: selectedArticle.titleAm,
                content: selectedArticle.content,
                contentAm: selectedArticle.contentAm,
                excerpt: '',
                status:
                  selectedArticle.status === 'Published' ? 'PUBLISHED' :
                  selectedArticle.status === 'Review' ? 'REVIEW' :
                  selectedArticle.status === 'Archived' ? 'ARCHIVED' : 'DRAFT',
                language:
                  selectedArticle.language === 'am' ? 'AM' :
                  selectedArticle.language === 'both' ? 'BOTH' : 'EN',
                categoryId: selectedArticle.categoryId || '',
                authorId: '',
                publishedAt: selectedArticle.publishedAt || '',
                expiresAt: selectedArticle.expiryDate || '',
                tags: selectedArticle.tags || [],
              }}
              onCancel={() => setShowEditDialog(false)}
              onSubmit={(updated: any) => {
                const mapToUi = (a: any): Article => ({
                  id: a.id,
                  title: a.title,
                  titleAm: a.titleAm || undefined,
                  content: a.content,
                  contentAm: a.contentAm || undefined,
                  category: (categories.find(c => c.id === a.categoryId)?.name) || selectedArticle.category,
                  categoryId: a.categoryId,
                  tags: a.tags || undefined,
                  author: a.author || selectedArticle.author,
                  status: String(a.status).toUpperCase() === 'PUBLISHED' ? 'Published' :
                          String(a.status).toUpperCase() === 'REVIEW' ? 'Review' :
                          String(a.status).toUpperCase() === 'ARCHIVED' ? 'Archived' : 'Draft',
                  language: String(a.language).toUpperCase() === 'AM' ? 'am' :
                           String(a.language).toUpperCase() === 'BOTH' ? 'both' : 'en',
                  views: a.viewCount ?? selectedArticle.views,
                  likes: a.likeCount ?? selectedArticle.likes,
                  dislikes: a.dislikeCount ?? selectedArticle.dislikes,
                  rating: a.rating ?? selectedArticle.rating,
                  createdAt: a.createdAt || selectedArticle.createdAt,
                  updatedAt: a.updatedAt || new Date().toISOString(),
                  publishedAt: a.publishedAt || undefined,
                  expiryDate: a.expiresAt || undefined,
                })

                if (updated?.id) {
                  setArticles(prev => prev.map(a => a.id === updated.id ? mapToUi(updated) : a))
                }
                setShowEditDialog(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Sheet */}
      <Sheet open={deleteSheetOpen} onOpenChange={setDeleteSheetOpen}>
        <SheetContent
          side="right"
          className="inset-auto left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md h-auto rounded-lg border p-0"
        >
          <SheetHeader>
            <SheetTitle>{t("kb.delete_title")}</SheetTitle>
            <SheetDescription>{t("kb.delete_desc")}</SheetDescription>
          </SheetHeader>
          {articleToDelete && (
            <div className="px-4">
              <div className="mb-4 rounded-md border p-3 text-sm">
                <div className="font-medium">{currentLanguage === 'am' && articleToDelete.titleAm ? articleToDelete.titleAm : articleToDelete.title}</div>
                {(articleToDelete.categoryId || articleToDelete.category) && (
                  <div className="mt-1 text-muted-foreground">
                    {articleToDelete.category || (articleToDelete.categoryId ? getCategoryName(articleToDelete.categoryId) : '')}
                  </div>
                )}
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => { setDeleteSheetOpen(false); setArticleToDelete(null) }}>
              {t("kb.cancel")}
            </Button>
            <Button variant="destructive" onClick={() => { if (articleToDelete) deleteArticle(articleToDelete.id) }}>
              {t("kb.delete")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </div>
  )
}