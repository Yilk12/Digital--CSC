"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, FileText, Loader2, Calendar, Trash2, Pencil, Eye, Search, Filter, Download, MoreVertical, ChevronDown, ChevronUp, CheckCircle, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import PlanCreateForm from "./PlanCreateForm";
import PlanDetailView from "./PlanDetailView";

type Plan = {
  id: string;
  title: string;
  titleAm?: string | null;
  description?: string | null;
  type?: string | null;
  typeAm?: string | null;
  period: string;
  startDate: string;
  endDate: string;
  status?: string | null;
  fileUrl?: string | null;
  departmentId?: string | null;
  departmentHeadId?: string | null;
  teamLeaderId?: string | null;
  endUserId?: string | null;
  tasks?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string;
};

type FilterState = {
  period: string;
  status: string;
  type: string;
};

// Helper function to get token safely
const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token");
};

// Helper function to get user info from token
const getUserInfo = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      role: payload.role,
      departmentId: payload.departmentId,
      departmentName: payload.departmentName
    };
  } catch {
    return null;
  }
};

type PlanReportFormProps = {
  currentUserRole?: "planning" | "departmentHead" | "teamLeader" | "employee";
  initialMode?: string;
  lockMode?: boolean;
};

export default function PlanReportForm({ currentUserRole, initialMode, lockMode }: PlanReportFormProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [openDetail, setOpenDetail] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    period: "",
    status: "",
    type: ""
  });

  // User role and department state
  const [userInfo, setUserInfo] = useState<{ role: string; departmentId?: string; departmentName?: string } | null>(null);
  const [isPlanStrategyDept, setIsPlanStrategyDept] = useState<boolean>(false);
  const [isDepartmentHead, setIsDepartmentHead] = useState<boolean>(false);

  // Department Head specific states
  // Department Head flow is not needed on this page; keep minimal state for Plan & Strategies only

  // Fetch user info on component mount
  useEffect(() => {
    const info = getUserInfo();
    setUserInfo(info);
    
    if (info) {
      const dept = String(info.departmentName || '').toLowerCase();
      const isPlanDept = dept.includes('plan') || dept.includes('strategy');
      setIsPlanStrategyDept(isPlanDept);
      // Force off Department Head UI on this page
      setIsDepartmentHead(false as any);
    }
  }, []);

  // Fetch plans from API
  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/planning?page=1&pageSize=20`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });
      
      if (!res.ok) throw new Error(`Failed to fetch plans: ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      setPlans(items);
    } catch (e: any) {
      setError(e?.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Filter and search plans
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const matchesSearch = 
        plan.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.period?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPeriod = !filters.period || plan.period === filters.period;
      const matchesStatus = !filters.status || plan.status === filters.status;
      const matchesType = !filters.type || plan.type === filters.type;

      return matchesSearch && matchesPeriod && matchesStatus && matchesType;
    });
  }, [plans, searchQuery, filters]);

  // Get unique values for filter dropdowns
  const uniquePeriods = useMemo(() => {
    const periods = plans.map(plan => plan.period).filter(Boolean) as string[];
    return Array.from(new Set(periods));
  }, [plans]);

  const uniqueStatuses = useMemo(() => {
    const statuses = plans.map(plan => plan.status).filter(Boolean) as string[];
    return Array.from(new Set(statuses));
  }, [plans]);

  const uniqueTypes = useMemo(() => {
    const types = plans.map(plan => plan.type).filter(Boolean) as string[];
    return Array.from(new Set(types));
  }, [plans]);

  const formatDate = (iso?: string) => {
    if (!iso) return "N/A";
    try {
      return new Date(iso).toLocaleDateString("en-GB");
    } catch {
      return iso;
    }
  };

  const getStatusColor = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCardClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setOpenDetail(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      const token = getToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/planning/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!res.ok) throw new Error("Failed to delete plan");
      alert("Plan deleted successfully");
      setOpenDetail(false);
      fetchPlans();
    } catch (err) {
      alert("Error deleting plan");
    }
  };

  // Department Head bulk assignment and selection UI are removed for Plan & Strategies page

  const clearFilters = () => {
    setFilters({ period: "", status: "", type: "" });
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 px-4 py-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-indigo-600 bg-clip-text text-transparent">
              Plans & Strategies
            </h1>
            <p className="text-slate-600 mt-2">Manage and track your organizational plans</p>
          </div>
          
          {/* Show Create New Plan button only for Plan & Strategies department */}
         
            <Button
              onClick={() => setOpenCreate(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" /> 
              Create New Plan
            </Button>
       
        </div>

        {/* Department Head Assignment Panel removed for Plan & Strategies */}

        {/* Search and Filter Bar */}
        <Card className="mb-8 border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search plans by title, description, or period..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 rounded-xl border-slate-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="rounded-xl border-slate-200 hover:bg-slate-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>
                
                {(filters.period || filters.status || filters.type || searchQuery) && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="rounded-xl text-slate-600 hover:text-slate-800"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Period</label>
                    <select
                      value={filters.period}
                      onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                      className="w-full rounded-xl border-slate-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="">All Periods</option>
                      {uniquePeriods.map((period, index) => (
                        <option key={index} value={period}>
                          {period}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full rounded-xl border-slate-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="">All Statuses</option>
                      {uniqueStatuses.map((status, index) => (
                        <option key={index} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Type</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full rounded-xl border-slate-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="">All Types</option>
                      {uniqueTypes.map((type, index) => (
                        <option key={index} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md rounded-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-800">{plans.length}</div>
              <div className="text-sm text-slate-600">Total Plans</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md rounded-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {plans.filter(p => p.status?.toLowerCase() === 'completed').length}
              </div>
              <div className="text-sm text-slate-600">Completed</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md rounded-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {plans.filter(p => p.status?.toLowerCase() === 'in progress').length}
              </div>
              <div className="text-sm text-slate-600">In Progress</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md rounded-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-800">{filteredPlans.length}</div>
              <div className="text-sm text-slate-600">Filtered Results</div>
            </CardContent>
          </Card>
        </div>

        {/* Loading / Error / Empty / Cards */}
        {loading ? (
          <Card className="border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
              <div className="text-slate-600 font-medium">Loading plans...</div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="shadow-lg rounded-2xl bg-red-50 border border-red-200">
            <CardContent className="p-6 text-center">
              <div className="text-red-600 font-medium text-lg mb-2">Error Loading Plans</div>
              <div className="text-red-500 mb-4">{error}</div>
              <Button 
                onClick={fetchPlans}
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredPlans.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No plans found</h3>
              <p className="text-slate-600 mb-6">
                {plans.length === 0 
                  ? "Get started by creating your first plan." 
                  : "No plans match your current filters."}
              </p>
              {plans.length === 0 && isPlanStrategyDept ? (
                <Button
                  onClick={() => setOpenCreate(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Plus className="w-5 h-5 mr-2" /> Create Your First Plan
                </Button>
              ) : (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <Card 
                key={plan.id}
                className="border-0 shadow-md rounded-2xl bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
                onClick={() => handleCardClick(plan)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* No selection checkbox on Plan & Strategies page */}
                      <div className="p-2 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                          {plan.title || "Untitled Plan"}
                        </CardTitle>
                        {plan.description && (
                          <p className="text-sm text-slate-600 line-clamp-2 mt-1">{plan.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCardClick(plan); }}>
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDelete(plan.id); 
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg">
                        {plan.period || "N/A"}
                      </Badge>
                      {plan.status && (
                        <Badge className={`${getStatusColor(plan.status)} rounded-lg`}>
                          {plan.status}
                        </Badge>
                      )}
                      {plan.type && (
                        <Badge variant="outline" className="rounded-lg">
                          {plan.type}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(plan.startDate)} - {formatDate(plan.endDate)}</span>
                      </div>
                      
                      {plan.fileUrl && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Plan Dialog - Only for Plan & Strategies department */}
        
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogContent className="w-full max-w-6xl lg:max-w-[1200px] max-h-[90vh] overflow-y-auto rounded-3xl p-0">
              <DialogHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-t-3xl">
                <DialogTitle className="text-2xl font-bold text-white">Create New Plan</DialogTitle>
                <DialogDescription className="text-indigo-100 text-lg">
                  Fill in the details to create a new strategic plan
                </DialogDescription>
              </DialogHeader>
              <div className="p-8">
                <PlanCreateForm
                  onSuccessAction={() => {
                    setOpenCreate(false);
                    fetchPlans();
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        

        {/* Detail Sheet */}
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
                onEditAction={(plan) => alert(`Edit clicked for ${plan.title}`)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}