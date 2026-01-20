"use client";

import React from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Calendar, Search, Filter, Users, Loader2, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import PlanDetailView from "./PlanDetailView";

type Plan = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  createdAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export default function EndUserPlan() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("newest");
  const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null);
  const [openDetail, setOpenDetail] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") ||
              localStorage.getItem("jwt") ||
              localStorage.getItem("token")
            : null;

        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${base}/api/planning/end-user/plans`, { headers, cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch plans (${res.status})`);
        const data = await res.json();
        if (!mounted) return;
        const items: Plan[] = Array.isArray(data?.items) ? data.items : [];
        setPlans(items);
        setFilteredPlans(items);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load plans");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter and sort plans
  React.useEffect(() => {
    let result = [...plans];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(plan => 
        plan.title.toLowerCase().includes(term) ||
        (plan.description && plan.description.toLowerCase().includes(term)) ||
        (plan.status && plan.status.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(plan => plan.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        case "startDate":
          return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
        case "endDate":
          return new Date(a.endDate || 0).getTime() - new Date(b.endDate || 0).getTime();
        default:
          return 0;
      }
    });

    setFilteredPlans(result);
  }, [plans, searchTerm, statusFilter, sortBy]);

  const openPlanDetail = (plan: Plan) => {
    setSelectedPlan(plan);
    setOpenDetail(true);
  };

  const closeDetail = () => {
    setOpenDetail(false);
    setSelectedPlan(null);
  };

  const handleDelete: (planId: string) => Promise<void> = async (planId) => {
    // Implement delete functionality for end user if needed
    console.log("Delete plan:", planId);
    closeDetail();
  };

  const getStatusColor = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "No date";
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(iso);
    }
  };

  const getStatusCount = (status: string) => {
    return plans.filter(plan => plan.status === status).length;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="space-y-6 p-6 bg-white">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">My Plans</h1>
            <p className="text-slate-600 mt-2">View and manage plans assigned to you</p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-slate-600">
              {plans.length} plan{plans.length !== 1 ? 's' : ''} assigned
            </span>
          </div>
        </div>

        {/* Stats Overview */}
        {plans.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{getStatusCount('pending')}</div>
                <div className="text-sm text-blue-700">Pending</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{getStatusCount('in progress')}</div>
                <div className="text-sm text-yellow-700">In Progress</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{getStatusCount('completed')}</div>
                <div className="text-sm text-green-700">Completed</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-slate-600">{plans.length}</div>
                <div className="text-sm text-slate-700">Total</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search plans by title, description, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="startDate">Start Date</SelectItem>
                <SelectItem value="endDate">End Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Plans Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-slate-600">Loading your plans...</span>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 text-lg mb-2">
              {plans.length === 0 ? "No plans assigned to you yet." : "No plans match your search."}
            </div>
            {searchTerm || statusFilter !== "all" ? (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className="shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border hover:border-blue-300 bg-white group"
                onClick={() => openPlanDetail(plan)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {plan.title}
                      </div>
                      {plan.description ? (
                        <div className="text-sm text-slate-600 line-clamp-3">
                          {plan.description}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Status and Dates */}
                  <div className="space-y-2">
                    {plan.status && (
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(plan.status)} font-medium`}
                      >
                        {plan.status}
                      </Badge>
                    )}
                    
                    {(plan.startDate || plan.endDate) && (
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {plan.startDate && (
                          <span>Starts: {formatDate(plan.startDate)}</span>
                        )}
                        {plan.endDate && (
                          <span>Ends: {formatDate(plan.endDate)}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created: {formatDate(plan.createdAt)}
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 font-medium">
                      <Eye className="w-3 h-3" />
                      View Details
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Count */}
        {filteredPlans.length > 0 && (
          <div className="text-center text-slate-500 text-sm">
            Showing {filteredPlans.length} of {plans.length} plans
          </div>
        )}

        {/* Plan Detail Sheet */}
        <Sheet open={openDetail} onOpenChange={setOpenDetail}>
          <SheetContent 
            side="right" 
            className="w-full sm:max-w-2xl overflow-y-auto fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[90vh] rounded-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            <SheetHeader className="bg-gradient-to-r from-slate-800 to-slate-600 text-white p-6 rounded-t-2xl">
              <SheetTitle className="text-white">Plan Details</SheetTitle>
              <SheetDescription className="text-slate-200">
                Complete information about the selected plan
              </SheetDescription>
            </SheetHeader>
            <div className="p-6">
              {selectedPlan && (
                <PlanDetailView
                  plan={selectedPlan}
                  onDeleteAction={handleDelete}
                  onEditAction={(plan) => {
                    console.log("Edit plan:", plan);
                    closeDetail();
                  }}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}