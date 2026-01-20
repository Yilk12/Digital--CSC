"use client"

import { Label } from "@/app/components/ui/label"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Separator } from "@/app/components/ui/separator"
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar"
import { Textarea } from "@/app/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  Eye,
  Calendar,
  User,
  Globe,
  MessageSquare,
  Send,
  Edit,
  Share,
  Bookmark,
  Image,
  Video,
  FileText,
  MoreHorizontal,
} from "lucide-react"
import { useToast } from "@/app/components/toast-provider"
import { articlesApi, ArticleComment } from "@/app/lib/articles-api"
import { apiGet } from "@/app/lib/api"

interface ArticleViewerProps {
  article: {
    id: string
    title: string
    titleAm?: string
    content: string
    contentAm?: string
    category?: string
    tags?: string[]
    author?: string
    status: string
    language: string
    views: number
    likes: number
    dislikes: number
    rating: number
    createdAt: string
    updatedAt: string
    publishedAt?: string
    attachments?: { id: string; filename: string; filepath?: string; mimetype?: string; size?: number }[]
  }
  onClose: () => void
}

interface Comment {
  id: string
  author: string
  content: string
  timestamp: string
  likes: number
  parentId?: string
}

export function ArticleViewer({ article, onClose }: ArticleViewerProps) {
  const [language] = useState<"en" | "am">("en")
  const [viewLanguage, setViewLanguage] = useState<"en" | "am">("en")
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [userRating, setUserRating] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [hasDisliked, setHasDisliked] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({})
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null)
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const commentsSectionRef = useRef<HTMLDivElement | null>(null)
  const { show: toast } = useToast()

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

  const handleAddComment = async () => {
    const content = newComment.trim()
    if (!content) return

    try {
      const created: ArticleComment = await articlesApi.addComment(article.id, content)
      const authorName = created.author
        ? `${created.author.firstName} ${created.author.lastName}`.trim() || "Unknown user"
        : "Unknown user"

      const mapped: Comment = {
        id: created.id,
        author: authorName,
        content: created.content,
        timestamp: created.createdAt,
        likes: 0,
        parentId: replyToCommentId || undefined,
      }

      setComments((prev) => [mapped, ...prev])
      setNewComment("")
      setReplyToCommentId(null)

      toast({
        variant: "success",
        title: language === "en" ? "Comment posted" : "አስተያየት ተለጥፏል",
      })
    } catch (err: any) {
      console.error("Failed to add comment", err)
      toast({
        variant: "destructive",
        title: language === "en" ? "Failed to post comment" : "አስተያየት መለጠፍ አልተሳካም",
        description: typeof err?.message === "string" ? err.message : undefined,
      })
    }
  }

  const handleLike = () => {
    setHasLiked(!hasLiked)
    if (hasDisliked) setHasDisliked(false)
  }

  const handleDislike = () => {
    setHasDisliked(!hasDisliked)
    if (hasLiked) setHasLiked(false)
  }

  const handleLikeComment = (commentId: string) => {
    if (likedCommentIds[commentId]) return

    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c)),
    )
    setLikedCommentIds((prev) => ({ ...prev, [commentId]: true }))
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await articlesApi.deleteComment(article.id, commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast({
        variant: "success",
        title: language === "en" ? "Comment deleted" : "አስተያየት ተሰርዟል",
      })
    } catch (err: any) {
      console.error("Failed to delete comment", err)
      toast({
        variant: "destructive",
        title: language === "en" ? "Failed to delete comment" : "አስተያየት መሰረዝ አልተሳካም",
        description: typeof err?.message === "string" ? err.message : undefined,
      })
    }
  }

  const handleHideComment = async (commentId: string) => {
    try {
      const updated = await articlesApi.hideComment(article.id, commentId)
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: updated.content } : c))
      toast({
        variant: "success",
        title: language === "en" ? "Comment hidden" : "አስተያየት ተደብቋል",
      })
    } catch (err: any) {
      console.error("Failed to hide comment", err)
      toast({
        variant: "destructive",
        title: language === "en" ? "Failed to hide comment" : "አስተያየት መደበቅ አልተሳካም",
        description: typeof err?.message === "string" ? err.message : undefined,
      })
    }
  }

  const handleReportComment = (commentId: string) => {
    console.log("Reporting comment", commentId)
    toast({
      variant: "success",
      title: language === "en" ? "Comment reported" : "አስተያየት ተገምግሟል",
      description: language === "en"
        ? "Our team will review this comment."
        : "ይህ አስተያየት ይመረመራል።",
    })
  }

  const handleReplyToComment = (commentId: string, author: string) => {
    setReplyToCommentId(commentId)
    const prefix = author ? `${author}, ` : ""
    setNewComment((prev) => (prev.trim().length === 0 ? prefix : prev))

    // Focus the textarea after state update
    setTimeout(() => {
      commentTextareaRef.current?.focus()
    }, 0)
  }

  useEffect(() => {
    const loadComments = async () => {
      try {
        setCommentsLoading(true)
        const data: any = await apiGet<any>(`/knowledge-base/articles/${article.id}`)
        const list = Array.isArray(data?.comments) ? data.comments : []
        const mapped: Comment[] = list.map((c: any) => {
          const authorName = c.author
            ? `${c.author.firstName} ${c.author.lastName}`.trim() || "Unknown user"
            : "Unknown user"
          return {
            id: c.id,
            author: authorName,
            content: c.content,
            timestamp: c.createdAt,
            likes: (c as any)?.likeCount ?? 0,
            parentId: undefined,
          }
        })
        setComments(mapped)
      } catch (err: any) {
        console.error("Failed to load comments", err)
        toast({
          variant: "destructive",
          title: language === "en" ? "Failed to load comments" : "አስተያየቶች መመልከት አልተሳካም",
          description: typeof err?.message === "string" ? err.message : undefined,
        })
      } finally {
        setCommentsLoading(false)
      }
    }

    loadComments()
  }, [article.id, language, toast])

  const canShowAmharic = article.language === "both" || article.language === "am"
  const currentTitle = viewLanguage === "am" && article.titleAm ? article.titleAm : article.title
  const currentContent = viewLanguage === "am" && article.contentAm ? article.contentAm : article.content
  const isHtmlContent = /<\/?[a-z][\s\S]*>/i.test(currentContent || "")

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">{currentTitle}</h1>

            <div className="flex items-center gap-2">
              {canShowAmharic && (
                <div className="flex gap-2">
                  <Button
                    variant={viewLanguage === "en" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewLanguage("en")}
                  >
                    EN
                  </Button>
                  <Button
                    variant={viewLanguage === "am" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewLanguage("am")}
                  >
                    አማ
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => {
                  commentsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                  // Focus the comment input shortly after scrolling
                  setTimeout(() => {
                    commentTextareaRef.current?.focus()
                  }, 300)
                }}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{comments.length}</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {article.author || ""}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(article.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Article Content (normal page section, no card) */}
        <div className="prose max-w-none bg-transparent">
          {isHtmlContent ? (
            <div
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentContent }}
            />
          ) : (
            <div className="whitespace-pre-wrap break-words leading-relaxed">{currentContent}</div>
          )}
        </div>

        {/* Attachments directly below description */}
        {Array.isArray(article.attachments) && article.attachments.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            <h3 className="text-base font-semibold">
              {language === "en" ? "Attachments" : "አባሪዎች"} ({article.attachments.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {article.attachments.map((att) => {
                const mt = (att.mimetype || "").toLowerCase()
                const isImage = mt.startsWith("image/")
                const isVideo = mt.startsWith("video/")
                const isPdf = mt === "application/pdf"
                const isDoc = mt.includes("word") || mt.includes("officedocument.wordprocessingml")
                const isXls = mt.includes("excel") || mt.includes("spreadsheetml")
                const prettySize = typeof att.size === "number" ? `${Math.ceil(att.size / 1024)} KB` : ""
                return (
                  <a
                    key={att.id}
                    href={att.filepath || "#"}
                    target={att.filepath ? "_blank" : undefined}
                    rel={att.filepath ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors"
                    title={att.filename}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-white border text-muted-foreground">
                      {isImage ? (
                        <Image className="w-5 h-5" />
                      ) : isVideo ? (
                        <Video className="w-5 h-5" />
                      ) : isPdf ? (
                        <FileText className="w-5 h-5" />
                      ) : isDoc ? (
                        <FileText className="w-5 h-5" />
                      ) : isXls ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{att.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {att.mimetype || ""} {prettySize ? `• ${prettySize}` : ""}
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {(article.tags || []).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Meta row inside details: views, likes, dislikes, share, comments */}
        <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-base">👁️</span>
            <span>{article.views}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-green-600">
              <span className="text-base">👍</span>
              <span>{article.likes}</span>
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <span className="text-base">👎</span>
              <span>{article.dislikes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Share className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-base">💬</span>
              <span>{comments.length}</span>
            </div>
          </div>
        </div>

        {/* Comments (inline, no card) */}
        <div ref={commentsSectionRef} className="pt-4 space-y-4">
          <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            <span>{language === "en" ? "Comments" : "አስተያየቶች"}</span>
            <span className="text-sm text-muted-foreground">({comments.length})</span>
          </div>

          <div className="space-y-4">
            {/* Add Comment */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center relative">
                <Textarea
                  ref={commentTextareaRef}
                  className="flex-1 h-10 min-h-[40px] max-h-[40px] resize-none rounded-lg border border-gray-300 px-3 text-sm"
                  placeholder={language === "en" ? "Write a comment..." : "አስተያየትዎን ይጻፉ..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddComment()
                    }
                  }}
                />
                <div className="flex sm:block justify-end gap-2 sm:gap-3 mt-1 sm:mt-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3 text-base"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                  >
                    😊
                  </Button>
                  <Button
                    className="px-5 bg-slate-500 hover:bg-slate-600 text-white"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {language === "en" ? "Post Comment" : "አስተያየት ይለጥፉ"}
                  </Button>
                </div>
                {showEmojiPicker && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg p-2 z-10">
                    <div className="flex justify-end mb-1">
                      <button
                        type="button"
                        className="w-5 h-5 flex items-center justify-center text-xs rounded-full hover:bg-slate-100 text-slate-500"
                        onClick={() => setShowEmojiPicker(false)}
                        aria-label="Close emoji picker"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-1 text-xl">
                      {"😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😎 🤩 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤨 😐 😑 😶 🙄 😬 🤥 😴 🤤 😪 📚 📖 📝 🧠 💡 🎓 🏫 🏢 💻 🖥️ 🖱️ ⌨️ 📱 🤖 🔧 ⚙️ 📊 📈 📉 📡 🛰️ 🔌 🔋 🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐦 🐤 🐣 🐟 🐠 🐙 🦑 🦐 🦀 🐢 🐍 🐘 🐫 🦒 🐎 🏠 🏡 🏘️ 🏢 🏬 🏫 🏥 🏦 🏛️ 🕌 🕍 🛕 🍎 🍊 🍌 🍉 🍇 🍓 🍒 🍍 🥭 🥝 🥑 🌽 🥕 🥔 🥐 🍞 🧀 🍕 🍔 🍟 🌭 🌮 🌯 🥗 🍱 🍣 🍜 🍝 🍲 🍰 🧁 🍩 ☕ 🍵 🥤 🍺 🍻 🍷 🥂 🥃 📣 📢 📯 🔔 🔕".split(" ").filter(Boolean).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="flex items-center justify-center rounded hover:bg-slate-100"
                          onClick={() => {
                            setNewComment((prev) => prev + (prev ? ` ${emoji}` : emoji))
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Comments List */}
              <div className="space-y-3 pt-2">
                {comments
                  .filter((c) => !c.parentId)
                  .map((comment) => {
                    const replies = comments.filter((r) => r.parentId === comment.id)
                    return (
                      <div key={comment.id} className="space-y-2">
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm text-slate-900">{comment.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(comment.timestamp)}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                                    aria-label={language === "en" ? "Comment actions" : "የአስተያየት እርምጃዎች"}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[160px]">
                                  <DropdownMenuItem onClick={() => handleHideComment(comment.id)}>
                                    {language === "en" ? "Hide comment" : "አስተያየትን ደብቅ"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleReportComment(comment.id)}>
                                    {language === "en" ? "Report comment" : "አስተያየትን ጥሬ አድርግ"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    {language === "en" ? "Delete comment" : "አስተያየትን ሰርዝ"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 whitespace-pre-wrap mb-2">{comment.content}</p>
                          <div className="flex items-center gap-4 text-xs">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto px-2 py-1 text-xs flex items-center gap-1 text-slate-700"
                              onClick={() => handleLikeComment(comment.id)}
                              disabled={likedCommentIds[comment.id]}
                            >
                              <span>👍</span>
                              <span>{language === "en" ? "Like" : "ወድድ"}</span>
                              <span>{comment.likes}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto px-2 py-1 text-xs text-blue-600"
                              onClick={() => handleReplyToComment(comment.id, comment.author)}
                            >
                              {language === "en" ? "Reply" : "መልስ"}
                            </Button>
                          </div>
                        </div>

                        {/* Replies */}
                        {replies.length > 0 && (
                          <div className="space-y-2 pl-6 border-l border-slate-200 ml-3">
                            {replies.map((reply) => (
                              <div key={reply.id} className="pt-2 pb-1">
                                <div className="text-xs font-medium text-slate-700 mb-0.5">
                                  {reply.author || (language === "en" ? "You" : "እርስዎ")}
                                </div>
                                <div className="text-sm text-slate-800 whitespace-pre-wrap">
                                  {reply.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                {comments.length === 0 && (
                  <div className="text-sm text-muted-foreground pt-1">
                    {language === "en" ? "No comments yet. Be the first to comment." : "አስተያየት የለም። መጀመሪያውን እርስዎ ይጨምሩ።"}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}
