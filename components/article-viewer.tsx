"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"

interface ArticleViewerProps {
  article: {
    id: string
    title: string
    titleAm?: string
    content: string
    contentAm?: string
    category: string
    tags: string[]
    author: string
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
}

const mockComments: Comment[] = [
  {
    id: "1",
    author: "Sarah Wilson",
    content: "This article was very helpful! The step-by-step instructions made it easy to follow.",
    timestamp: "2024-01-15T10:30:00Z",
    likes: 5,
  },
  {
    id: "2",
    author: "Ahmed Hassan",
    content: "Great explanation. Could you add more details about the troubleshooting section?",
    timestamp: "2024-01-14T16:20:00Z",
    likes: 2,
  },
]

export function ArticleViewer({ article, onClose }: ArticleViewerProps) {
  const [language] = useState<"en" | "am">("en")
  const [viewLanguage, setViewLanguage] = useState<"en" | "am">("en")
  const [comments] = useState<Comment[]>(mockComments)
  const [newComment, setNewComment] = useState("")
  const [userRating, setUserRating] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [hasDisliked, setHasDisliked] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      console.log("Adding comment:", newComment)
      setNewComment("")
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

  const canShowAmharic = article.language === "both" || article.language === "am"
  const currentTitle = viewLanguage === "am" && article.titleAm ? article.titleAm : article.title
  const currentContent = viewLanguage === "am" && article.contentAm ? article.contentAm : article.content

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <Badge variant="default">{article.status}</Badge>
            <Badge variant="outline">{article.category}</Badge>
            {canShowAmharic && (
              <Badge variant="secondary" className="gap-1">
                <Globe className="w-3 h-3" />
                {language === "en" ? "Bilingual" : "ባለሁለት ቋንቋ"}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">{currentTitle}</h1>

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
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {article.author}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(article.updatedAt)}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            {language === "en" ? "Edit" : "አርትዕ"}
          </Button>
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            {language === "en" ? "Share" : "አጋራ"}
          </Button>
          <Button variant="outline" size="sm">
            <Bookmark className="w-4 h-4 mr-2" />
            {language === "en" ? "Save" : "አስቀምጥ"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Article Content */}
          <Card>
            <CardContent className="p-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap leading-relaxed">{currentContent}</div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>

              {/* Attachments */}
              {Array.isArray(article.attachments) && article.attachments.length > 0 && (
                <div className="mt-6 pt-6 border-t space-y-3">
                  <h3 className="text-base font-semibold">
                    {language === "en" ? "Attachments" : "አባሪዎች"} ({article.attachments.length})
                  </h3>
                  <ul className="space-y-2">
                    {article.attachments.map((att) => {
                      const mt = (att.mimetype || "").toLowerCase()
                      const isImage = mt.startsWith("image/")
                      const isVideo = mt.startsWith("video/")
                      const isPdf = mt === "application/pdf"
                      const isDoc = mt.includes("word") || mt.includes("officedocument.wordprocessingml")
                      const isXls = mt.includes("excel") || mt.includes("spreadsheetml")
                      const prettySize = typeof att.size === "number" ? `${Math.ceil(att.size / 1024)} KB` : ""
                      return (
                        <li key={att.id} className="flex items-center justify-between gap-3 p-2 rounded border">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-muted-foreground">
                              {isImage ? (
                                <Image className="w-4 h-4" />
                              ) : isVideo ? (
                                <Video className="w-4 h-4" />
                              ) : isPdf ? (
                                <FileText className="w-4 h-4" />
                              ) : isDoc ? (
                                <FileText className="w-4 h-4" />
                              ) : isXls ? (
                                <FileText className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </span>
                            <div className="truncate">
                              <div className="truncate text-sm font-medium">{att.filename}</div>
                              <div className="text-xs text-muted-foreground">
                                {att.mimetype || ""} {prettySize ? `• ${prettySize}` : ""}
                              </div>
                            </div>
                          </div>
                          {att.filepath ? (
                            <a
                              href={att.filepath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary underline"
                            >
                              {language === "en" ? "Open" : "ክፈት"}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">{language === "en" ? "No link" : "ሊንክ የለም"}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {language === "en" ? "Was this helpful?" : "ይህ ጠቃሚ ነበር?"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button variant={hasLiked ? "default" : "outline"} size="sm" onClick={handleLike} className="gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  {language === "en" ? "Yes" : "አዎ"} ({article.likes + (hasLiked ? 1 : 0)})
                </Button>
                <Button
                  variant={hasDisliked ? "destructive" : "outline"}
                  size="sm"
                  onClick={handleDislike}
                  className="gap-2"
                >
                  <ThumbsDown className="w-4 h-4" />
                  {language === "en" ? "No" : "አይ"} ({article.dislikes + (hasDisliked ? 1 : 0)})
                </Button>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === "en" ? "Rate this article:" : "ይህን ጽሁፍ ይደረጁ:"}
                </Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button key={star} variant="ghost" size="sm" className="p-1" onClick={() => setUserRating(star)}>
                      <Star
                        className={`w-5 h-5 ${
                          star <= userRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {language === "en" ? "Comments" : "አስተያየቶች"} ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              <div className="space-y-3">
                <Textarea
                  placeholder={language === "en" ? "Add a comment..." : "አስተያየት ይጨምሩ..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    {language === "en" ? "Post Comment" : "አስተያየት ይለጥፉ"}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {comment.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="ghost" size="sm" className="h-auto p-1 text-xs">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            {comment.likes}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-auto p-1 text-xs">
                            {language === "en" ? "Reply" : "መልስ"}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Article Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === "en" ? "Article Info" : "የጽሁፍ መረጃ"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">{language === "en" ? "Author" : "ደራሲ"}</p>
                <p className="text-sm text-muted-foreground">{article.author}</p>
              </div>
              <div>
                <p className="text-sm font-medium">{language === "en" ? "Category" : "ምድብ"}</p>
                <p className="text-sm text-muted-foreground">{article.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium">{language === "en" ? "Last Updated" : "የመጨረሻ ዝማኔ"}</p>
                <p className="text-sm text-muted-foreground">{formatDate(article.updatedAt)}</p>
              </div>
              {/* Published date hidden on user side */}
            </CardContent>
          </Card>

          {/* Related Articles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === "en" ? "Related Articles" : "ተዛማጅ ጽሁፎች"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm line-clamp-2">
                  {language === "en" ? "System Access Troubleshooting" : "የሲስተም መዳረሻ ችግር መፍታት"}
                </h4>
                <p className="text-xs text-muted-foreground">892 views</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm line-clamp-2">
                  {language === "en" ? "Document Upload Guidelines" : "የሰነድ መስቀያ መመሪያዎች"}
                </h4>
                <p className="text-xs text-muted-foreground">567 views</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
