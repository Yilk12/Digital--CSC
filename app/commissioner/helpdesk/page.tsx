"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface CombinedOverview {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  totalArticles: number;
  publishedArticles: number;
  avgResolutionTime: number;
  satisfactionRate: number;
}

interface TicketSummary {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  pastSlaTickets: number;
  avgResolutionTime: number;
  satisfactionRate: number;
}

interface ArticleSummary {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  expiringSoonArticles: number;
  totalViews: number;
  totalLikes: number;
  totalDislikes: number;
  engagementRate: number;
}

export default function CommissionerHelpdeskPage() {
  const [combinedOverview, setCombinedOverview] = useState<CombinedOverview | null>(null);
  const [ticketSummary, setTicketSummary] = useState<TicketSummary | null>(null);
  const [articleSummary, setArticleSummary] = useState<ArticleSummary | null>(null);
  const [ticketsByPriority, setTicketsByPriority] = useState<any[]>([]);
  const [ticketsByCategory, setTicketsByCategory] = useState<any[]>([]);
  const [articlesByStatus, setArticlesByStatus] = useState<any[]>([]);
  const [articlesByLanguage, setArticlesByLanguage] = useState<any[]>([]);
  const [ticketsOverTime, setTicketsOverTime] = useState<Record<string, any>>({});
  const [topArticles, setTopArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");
      
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") ||
              localStorage.getItem("jwt") ||
              localStorage.getItem("token")
            : null;

        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const baseUrl = process.env.NEXT_PUBLIC_API_URL;

        const [
          combinedRes,
          ticketSummaryRes,
          articleSummaryRes,
          ticketsByPriorityRes,
          ticketsByCategoryRes,
          articlesByStatusRes,
          articlesByLanguageRes,
          ticketsOverTimeRes,
          topArticlesRes
        ] = await Promise.all([
          fetch(`${baseUrl}/api/knowledge-base/articles/reports/combined-overview`, { headers }),
          fetch(`${baseUrl}/api/knowledge-base/articles/reports/ticket-summary`, { headers }),
          fetch(`${baseUrl}/api/knowledge-base/articles/reports/article-summary`, { headers }),
          fetch(`${baseUrl}/api/knowledge-base/articles/reports/tickets-by-priority`, { headers }),
          fetch(`${baseUrl}/api/knowledge-base/articles/reports/tickets-by-category`, { headers }),
          fetch(`${baseUrl}/api/knowledge-base/articles/reports/articles-by-status`, { headers }),
          fetch(`${baseUrl}/api/knowledge-base/articles/reports/articles-by-language`, { headers }),
          fetch(`${baseUrl}/api/knowledge-base/articles/reports/tickets-over-time?days=30`, { headers }),
          fetch(`${baseUrl}/api/knowledge-base/articles/reports/top-articles`, { headers })
        ]);

        if (!combinedRes.ok) throw new Error('Failed to load helpdesk reports');

        const [
          combinedData,
          ticketData,
          articleData,
          priorityData,
          categoryData,
          statusData,
          languageData,
          timeData,
          topArticlesData
        ] = await Promise.all([
          combinedRes.json(),
          ticketSummaryRes.json(),
          articleSummaryRes.json(),
          ticketsByPriorityRes.json(),
          ticketsByCategoryRes.json(),
          articlesByStatusRes.json(),
          articlesByLanguageRes.json(),
          ticketsOverTimeRes.json(),
          topArticlesRes.json()
        ]);

        setCombinedOverview(combinedData);
        setTicketSummary(ticketData);
        setArticleSummary(articleData);
        setTicketsByPriority(Array.isArray(priorityData) ? priorityData : []);
        setTicketsByCategory(Array.isArray(categoryData) ? categoryData : []);
        setArticlesByStatus(Array.isArray(statusData) ? statusData : []);
        setArticlesByLanguage(Array.isArray(languageData) ? languageData : []);
        setTicketsOverTime(timeData && typeof timeData === 'object' ? timeData : {});
        setTopArticles(Array.isArray(topArticlesData) ? topArticlesData : []);

      } catch (err: any) {
        console.error('Failed to fetch helpdesk reports:', err);
        setError(err?.message || 'Failed to load helpdesk reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Chart data configurations
  const ticketsByPriorityData = {
    labels: ticketsByPriority.map(t => {
      const priority = t.priority?.toLowerCase() || 'unknown';
      return priority.charAt(0).toUpperCase() + priority.slice(1);
    }),
    datasets: [
      {
        label: "Tickets Count",
        data: ticketsByPriority.map(t => t.count || 0),
        backgroundColor: [
          '#ef4444', // High - Red
          '#f59e0b', // Medium - Orange
          '#10b981', // Low - Green
          '#6b7280', // Unknown - Gray
        ],
        borderWidth: 1,
      },
    ],
  };

  const ticketsByCategoryData = {
    labels: ticketsByCategory.map((t: any) => {
      const category = t.category?.toLowerCase() || 'unknown';
      return category.split('_').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }),
    datasets: [
      {
        label: "Tickets Count",
        data: ticketsByCategory.map((t: any) => t.count || 0),
        backgroundColor: [
          '#3b82f6', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
          '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#64748b'
        ],
        borderWidth: 1,
      },
    ],
  };

  const articlesByStatusData = {
    labels: articlesByStatus.map(a => {
      const status = a.status?.toLowerCase() || 'unknown';
      return status.charAt(0).toUpperCase() + status.slice(1);
    }),
    datasets: [
      {
        label: "Articles",
        data: articlesByStatus.map(a => a.count || 0),
        backgroundColor: [
          '#10b981', // Published - Green
          '#f59e0b', // Draft - Orange
          '#ef4444', // Archived - Red
          '#6b7280', // Unknown - Gray
        ],
        borderWidth: 2,
      },
    ],
  };

  const articlesByLanguageData = {
    labels: articlesByLanguage.map(a => {
      const lang = a.language?.toLowerCase() || 'unknown';
      return lang === 'en' ? 'English' : lang === 'am' ? 'Amharic' : 'Unknown';
    }),
    datasets: [
      {
        label: "Articles",
        data: articlesByLanguage.map(a => a.count || 0),
        backgroundColor: ['#3b82f6', '#10b981', '#6b7280'],
        borderWidth: 2,
      },
    ],
  };

  const ticketsOverTimeData = {
    labels: Object.keys(ticketsOverTime).slice(-15),
    datasets: [
      {
        label: "Total Tickets",
        data: Object.values(ticketsOverTime).slice(-15).map((day: any) => day.total || 0),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Resolved",
        data: Object.values(ticketsOverTime).slice(-15).map((day: any) => day.resolved || 0),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: true,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading helpdesk reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Reports</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Help Desk Analytics</h1>
          <p className="text-slate-600">Comprehensive overview of support tickets and knowledge base performance</p>
        </div>

        {/* Combined Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Ticket Cards */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Open Tickets</p>
                <p className="text-2xl font-bold text-slate-900">
                  {combinedOverview?.openTickets || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  of {combinedOverview?.totalTickets || 0} total
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500 bg-opacity-10">
                <span className="text-2xl">🎫</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Avg. Resolution Time</p>
                <p className="text-2xl font-bold text-slate-900">
                  {combinedOverview?.avgResolutionTime || 0}h
                </p>
                <p className="text-xs text-slate-500 mt-1">Average</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500 bg-opacity-10">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
          </div>

          {/* Article Cards */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Published Articles</p>
                <p className="text-2xl font-bold text-slate-900">
                  {combinedOverview?.publishedArticles || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  of {combinedOverview?.totalArticles || 0} total
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500 bg-opacity-10">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Satisfaction Rate</p>
                <p className="text-2xl font-bold text-slate-900">
                  {combinedOverview?.satisfactionRate || 0}%
                </p>
                <p className="text-xs text-slate-500 mt-1">Customer satisfaction</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500 bg-opacity-10">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Ticket Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Ticket Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-600">Resolved Tickets</span>
                <span className="font-semibold text-green-600">{ticketSummary?.resolvedTickets || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-600">Past SLA</span>
                <span className="font-semibold text-red-600">{ticketSummary?.pastSlaTickets || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Resolution Rate</span>
                <span className="font-semibold text-blue-600">
                  {ticketSummary?.totalTickets ? 
                    Math.round((ticketSummary.resolvedTickets / ticketSummary.totalTickets) * 100) : 0
                  }%
                </span>
              </div>
            </div>
          </div>

          {/* Article Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Knowledge Base</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-600">Draft Articles</span>
                <span className="font-semibold text-orange-600">{articleSummary?.draftArticles || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-600">Total Views</span>
                <span className="font-semibold text-blue-600">{articleSummary?.totalViews || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Engagement Rate</span>
                <span className="font-semibold text-green-600">{articleSummary?.engagementRate || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tickets by Priority */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Tickets by Priority</h3>
            <div className="h-80">
              <Bar data={ticketsByPriorityData} options={chartOptions} />
            </div>
          </div>

          {/* Tickets by Category */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Tickets by Category</h3>
            <div className="h-80">
              <Doughnut data={ticketsByCategoryData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Articles by Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Articles by Status</h3>
            <div className="h-80">
              <Pie data={articlesByStatusData} options={chartOptions} />
            </div>
          </div>

          {/* Articles by Language */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Articles by Language</h3>
            <div className="h-80">
              <Pie data={articlesByLanguageData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Tickets Over Time */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Ticket Trends (Last 15 Days)</h3>
          <div className="h-80">
            <Line data={ticketsOverTimeData} options={chartOptions} />
          </div>
        </div>

        {/* Top Articles */}
        {topArticles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Performing Articles</h3>
            <div className="space-y-3">
              {topArticles.map((article, index) => (
                <div key={article.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 line-clamp-1">{article.title}</p>
                      <p className="text-sm text-slate-500">
                        {article.viewCount} views • {article.likeCount} likes
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}