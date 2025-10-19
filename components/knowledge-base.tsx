"use client"

import { useState } from "react"
import { getCurrentUserRoles } from "@/app/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "lucide-react"
import { ArticleForm } from "./article-form"
import { ArticleViewer } from "./article-viewer"

interface Article {
  id: string
  title: string
  titleAm?: string
  content: string
  contentAm?: string
  category: string
  tags: string[]
  author: string
  status: "Draft" | "Review" | "Published" | "Archived"
  language: "en" | "am" | "both"
  views: number
  likes: number
  dislikes: number
  rating: number
  createdAt: string
  updatedAt: string
  publishedAt?: string
  expiryDate?: string
}

const mockArticles: Article[] = [
  {
    id: "KB-001",
    title: "How to Reset Your Password",
    titleAm: "የይለፍ ቃልዎን እንዴት እንደሚዳግሙ",
    content: "This guide will walk you through the steps to reset your password in the system...",
    contentAm: "ይህ መመሪያ በሲስተሙ ውስጥ የይለፍ ቃልዎን ለመዳግም የሚወስዷቸውን ደረጃዎች ያሳያዎታል...",
    category: "Authentication",
    tags: ["password", "security", "login"],
    author: "John Doe",
    status: "Published",
    language: "both",
    views: 1234,
    likes: 45,
    dislikes: 3,
    rating: 4.8,
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-12T00:00:00Z",
    publishedAt: "2024-01-12T00:00:00Z",
  },
  {
    id: "KB-002",
    title: "System Access Troubleshooting",
    titleAm: "የሲስተም መዳረሻ ችግር መፍታት",
    content: "Common issues and solutions for system access problems...",
    contentAm: "ለሲስተም መዳረሻ ችግሮች የተለመዱ ችግሮች እና መፍትሄዎች...",
    category: "Technical Support",
    tags: ["access", "troubleshooting", "system"],
    author: "Sarah Wilson",
    status: "Published",
    language: "both",
    views: 892,
    likes: 32,
    dislikes: 1,
    rating: 4.6,
    createdAt: "2024-01-08T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
    publishedAt: "2024-01-10T00:00:00Z",
  },
  {
    id: "KB-003",
    title: "Document Upload Guidelines",
    titleAm: "የሰነድ መስቀያ መመሪያዎች",
    content: "Best practices for uploading documents to the system...",
    contentAm: "ሰነዶችን ወደ ሲስተሙ ለመስቀል ምርጥ ልምዶች...",
    category: "User Guide",
    tags: ["documents", "upload", "guidelines"],
    author: "Mike Johnson",
    status: "Review",
    language: "both",
    views: 567,
    likes: 28,
    dislikes: 2,
    rating: 4.4,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-14T00:00:00Z",
  },
]

const categories = [
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
  { value: "people", label: "People", labelAm: "ሰዎች" },
  { value: "technology", label: "Technology", labelAm: "ቴክኖሎጂ" },
]

export function KnowledgeBase() {
  const [language] = useState<"en" | "am">("en")
  const [articles] = useState<Article[]>(mockArticles)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [languageFilter, setLanguageFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewerDialog, setShowViewerDialog] = useState(false)
  const roles = getCurrentUserRoles().map(r=>r.toLowerCase())
  const isAdmin = roles.includes("admin") || roles.includes("system_admin") || roles.includes("general director")

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.titleAm && article.titleAm.includes(searchTerm)) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory =
      categoryFilter === "all" || article.category.toLowerCase().replace(/\s+/g, "-") === categoryFilter

    const matchesStatus = statusFilter === "all" || article.status === statusFilter

    const matchesLanguage =
      languageFilter === "all" || article.language === languageFilter || article.language === "both"

    return matchesSearch && matchesCategory && matchesStatus && matchesLanguage
  })

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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getKBStats = () => {
    const total = articles.length
    const published = articles.filter((a) => a.status === "Published").length
    const totalViews = articles.reduce((sum, a) => sum + a.views, 0)
    const avgRating = articles.reduce((sum, a) => sum + a.rating, 0) / articles.length

    return { total, published, totalViews, avgRating }
  }

  const stats = getKBStats()

  const popularArticles = [...articles]
    .filter((a) => a.status === "Published")
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary font-[family-name:var(--font-playfair)]">
            {language === "en" ? "Knowledge Base" : "የእውቀት ቤዝ"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "en"
              ? "Create, manage, and share knowledge articles across the organization"
              : "በድርጅቱ ውስጥ የእውቀት ጽሁፎችን ይፍጠሩ፣ ያስተዳድሩ እና ያጋሩ"}
          </p>
        </div>

        {isAdmin && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {language === "en" ? "New Article" : "አዲስ ጽሁፍ"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{language === "en" ? "Create New Article" : "አዲስ ጽሁፍ ይፍጠሩ"}</DialogTitle>
                <DialogDescription>
                  {language === "en"
                    ? "Create a new knowledge base article to help users"
                    : "ተጠቃሚዎችን ለመርዳት አዲስ የእውቀት ቤዝ ጽሁፍ ይፍጠሩ"}
                </DialogDescription>
              </DialogHeader>
              <ArticleForm onClose={() => setShowCreateDialog(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards removed for user-facing view */}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {language === "en" ? "Search & Filters" : "ፍለጋ እና ማጣሪያዎች"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={language === "en" ? "Search articles..." : "ጽሁፎችን ይፈልጉ..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder={language === "en" ? "All Categories" : "ሁሉም ምድቦች"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "en" ? "All Categories" : "ሁሉም ምድቦች"}</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {language === "en" ? cat.label : cat.labelAm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder={language === "en" ? "All Status" : "ሁሉም ሁኔታዎች"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "en" ? "All Status" : "ሁሉም ሁኔታዎች"}</SelectItem>
                      <SelectItem value="Published">{language === "en" ? "Published" : "የታተመ"}</SelectItem>
                      <SelectItem value="Draft">{language === "en" ? "Draft" : "ረቂቅ"}</SelectItem>
                      <SelectItem value="Review">{language === "en" ? "Review" : "ግምገማ"}</SelectItem>
                      <SelectItem value="Archived">{language === "en" ? "Archived" : "የተቀመጠ"}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder={language === "en" ? "All Languages" : "ሁሉም ቋንቋዎች"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "en" ? "All Languages" : "ሁሉም ቋንቋዎች"}</SelectItem>
                      <SelectItem value="en">{language === "en" ? "English" : "እንግሊዝኛ"}</SelectItem>
                      <SelectItem value="am">{language === "en" ? "Amharic" : "አማርኛ"}</SelectItem>
                      <SelectItem value="both">{language === "en" ? "Both Languages" : "ሁለቱም ቋንቋዎች"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Articles List */}
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusColor(article.status)}>{article.status}</Badge>
                        <Badge variant="outline">{article.category}</Badge>
                        {article.language === "both" && (
                          <Badge variant="secondary" className="gap-1">
                            <Globe className="w-3 h-3" />
                            {language === "en" ? "Bilingual" : "ባለሁለት ቋንቋ"}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg">
                          {language === "am" && article.titleAm ? article.titleAm : article.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                          {language === "am" && article.contentAm
                            ? article.contentAm.substring(0, 150) + "..."
                            : article.content.substring(0, 150) + "..."}
                        </p>
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
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4 text-green-600" />
                            {article.likes}
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsDown className="w-4 h-4 text-red-600" />
                            {article.dislikes}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedArticle(article)
                          setShowViewerDialog(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive bg-transparent"
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
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Popular Articles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {language === "en" ? "Popular Articles" : "ተወዳጅ ጽሁፎች"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {popularArticles.map((article, index) => (
                <div key={article.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {language === "am" && article.titleAm ? article.titleAm : article.title}
                      </h4>
                      {/* Views hidden on user side */}
                    </div>
                  </div>
                  {index < popularArticles.length - 1 && <div className="border-b" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Categories" : "ምድቦች"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map((category) => {
                const count = articles.filter(
                  (a) => a.category.toLowerCase().replace(/\s+/g, "-") === category.value,
                ).length
                return (
                  <div key={category.value} className="flex items-center justify-between">
                    <span className="text-sm">{language === "en" ? category.label : category.labelAm}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Article Viewer Dialog */}
      <Dialog open={showViewerDialog} onOpenChange={setShowViewerDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedArticle && <ArticleViewer article={selectedArticle} onClose={() => setShowViewerDialog(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
