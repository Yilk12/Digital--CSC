"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { ArticleViewer } from "@/app/components/article-viewer";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { 
  BookOpen, 
  ArrowLeft, 
  Calendar, 
  Eye, 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  Tag, 
  User, 
  FolderOpen,
  Download,
  FileText
} from "lucide-react";
import { apiGet } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

interface ArticleDetailsResponse {
  id: string;
  title: string;
  titleAm?: string;
  content: string;
  contentAm?: string;
  category?: 
    | string
    | {
        id: string;
        name: string;
        isActive?: boolean;
        parentId?: string | null;
        createdAt?: string;
        updatedAt?: string;
      };
  categoryId?: string;
  tags?: string[];
  author?: string;
  status: string;
  language: string;
  viewCount?: number;
  likeCount?: number;
  dislikeCount?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
  attachments?: { id: string; filename: string; filepath?: string; mimetype?: string; size?: number }[];
}

function KnowledgeBaseDetailsInner() {
  const router = useRouter();
  const [articleId, setArticleId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticleDetailsResponse | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const id = sp.get('articleId');
    setArticleId(id);
  }, []);

  useEffect(() => {
    if (!articleId) return;

    let active = true;
    async function loadArticle() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGet<any>(`/knowledge-base/articles/${articleId}`);
        if (!active) return;
        if (!data) {
          setError("Article not found");
          return;
        }
        setArticle(data);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || "Failed to load article");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadArticle();
    return () => {
      active = false;
    };
  }, [articleId]);

  const mappedArticle = article
    ? {
        id: article.id,
        title: article.title,
        titleAm: article.titleAm,
        content: article.content,
        contentAm: article.contentAm,
        category:
          typeof article.category === "object" && article.category !== null
            ? article.category.name
            : article.category,
        tags: article.tags,
        author: article.author,
        status:
          String(article.status).toUpperCase() === "PUBLISHED"
            ? "Published"
            : String(article.status).toUpperCase() === "REVIEW"
            ? "Review"
            : String(article.status).toUpperCase() === "ARCHIVED"
            ? "Archived"
            : "Draft",
        language:
          String(article.language).toUpperCase() === "AM"
            ? "am"
            : String(article.language).toUpperCase() === "BOTH"
            ? "both"
            : "en",
        views: article.viewCount ?? 0,
        likes: article.likeCount ?? 0,
        dislikes: article.dislikeCount ?? 0,
        rating: article.rating ?? 0,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        publishedAt: article.publishedAt,
        attachments: article.attachments,
      }
    : null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getAttachmentTypeLabel = (filename?: string) => {
    if (!filename) return "FILE";

    const parts = filename.split('.');
    if (parts.length < 2) return "FILE";
    const ext = parts[parts.length - 1].toUpperCase();
    return ext;
  };

  const buildAttachmentUrl = (filepath?: string) => {
    if (!filepath) return null;
    if (filepath.startsWith("http://") || filepath.startsWith("https://")) {
      return filepath;
    }

    let base = process.env.NEXT_PUBLIC_API_URL || "";
    if (!base) return filepath;

    // If the base URL accidentally includes a path (e.g. http://localhost:3000/knowledge-base),
    // strip it so attachments are served from the server root (http://localhost:3000).
    try {
      const url = new URL(base);
      base = `${url.protocol}//${url.host}`;
    } catch {
      // If base is not a valid URL, fall back to the raw string
    }

    const needsSlash = !base.endsWith("/") && !filepath.startsWith("/");
    return `${base}${needsSlash ? "/" : ""}${filepath}`;
  };

  if (!articleId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base Article</h1>
            </div>
            <Button variant="outline" onClick={() => router.push("/knowledge-base")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Knowledge Base
            </Button>
          </div>

          <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Missing Article</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">No article ID provided in the URL.</p>
              <Button onClick={() => router.push("/knowledge-base")}>
                Browse Knowledge Base
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base Article</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Detailed view of the article</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push("/knowledge-base")}
            className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Error Loading Article</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push("/knowledge-base")}
                className="mt-4 border-red-200 text-red-600 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Return to Knowledge Base
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Article Content */}
        {!loading && !error && mappedArticle && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Article Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {formatDate(mappedArticle.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Updated: {formatDate(mappedArticle.updatedAt)}</span>
                    </div>
                    {mappedArticle.category && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FolderOpen className="w-4 h-4" />
                        <span>Category: {mappedArticle.category}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span>Author: {mappedArticle.author || "Unknown"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="font-semibold text-blue-600 dark:text-blue-400">{mappedArticle.views}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Views</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="font-semibold text-green-600 dark:text-green-400">{mappedArticle.likes}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Likes</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="font-semibold text-red-600 dark:text-red-400">{mappedArticle.dislikes}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Dislikes</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="font-semibold text-yellow-600 dark:text-yellow-400">{mappedArticle.rating}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Rating</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {mappedArticle.tags && mappedArticle.tags.length > 0 && (
                <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {mappedArticle.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Attachments */}
              {mappedArticle.attachments && mappedArticle.attachments.length > 0 && (
                <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Attachments
                    </h3>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {mappedArticle.attachments.map((attachment) => {
                          const href = buildAttachmentUrl(attachment.filepath);

                          const content = (
                            <div className="flex items-center justify-between gap-3 p-2 pr-3 text-xs rounded-full border border-gray-200 dark:border-gray-700 bg-blue-50/70 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white text-blue-700 border border-blue-100 text-[10px] font-semibold uppercase">
                                  {getAttachmentTypeLabel(attachment.filename)}
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-gray-900 dark:text-white truncate">
                                    {attachment.filename}
                                  </span>
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {formatFileSize(attachment.size)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white flex-shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            </div>
                          );

                          return href ? (
                            <a
                              key={attachment.id}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block cursor-pointer"
                            >
                              {content}
                            </a>
                          ) : (
                            <div key={attachment.id}>{content}</div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="shadow-lg border-gray-200 dark:border-gray-700">
                <CardContent className="p-0">
                  <ArticleViewer
                    article={mappedArticle}
                    onClose={() => router.push("/knowledge-base")}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function KnowledgeBaseDetailsPage() {
  return <KnowledgeBaseDetailsInner />;
}