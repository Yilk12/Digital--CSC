"use client";

import React from "react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { getDepartmentInfo, getAuthToken } from "@/app/lib/session";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Search, Filter, Users, Calendar, Loader2, Eye, CheckSquare, Square } from "lucide-react";
import PlanDetailView from "./PlanDetailView";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

export default function TeamLeaderPlan() {
  const router = useRouter();

  type Plan = {
    id: string;
    title: string;
    description?: string | null;
    status?: string;
    createdAt?: string;
    startDate?: string;
    endDate?: string;
  };

  type EndUser = { id: string; firstName?: string; lastName?: string; email?: string };

  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = React.useState<Plan[]>([]);
  const [endUsers, setEndUsers] = React.useState<EndUser[]>([]);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [selectedEndUser, setSelectedEndUser] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [assigning, setAssigning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("newest");

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
        
        const [plansRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/planning/team-leader/plans`, { 
            headers, 
            cache: "no-store" 
          }),
        ]);
        
        if (!plansRes.ok) throw new Error(`Failed to fetch plans (${plansRes.status})`);
        const plansJson = await plansRes.json();
        
        if (!mounted) return;
        const items: Plan[] = Array.isArray(plansJson?.items) ? plansJson.items : [];
        setPlans(items);
        setFilteredPlans(items);
        
        await fetchEndUsers();
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load data");
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
        default:
          return 0;
      }
    });

    setFilteredPlans(result);
  }, [plans, searchTerm, statusFilter, sortBy]);

  async function fetchEndUsers() {
    try {
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/planning/department/end-users`,
        { headers, cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Failed to fetch end users (${res.status})`);
      const data = await res.json();
      const eus: EndUser[] = Array.isArray(data) ? data : [];
      setEndUsers(eus);
    } catch (e) {
      console.error("Failed to load end users:", e);
    }
  }

  const toggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = () => {
    if (allSelectedIds.length === filteredPlans.length) {
      // Deselect all
      setSelected({});
    } else {
      // Select all
      const newSelected: Record<string, boolean> = {};
      filteredPlans.forEach(plan => {
        newSelected[plan.id] = true;
      });
      setSelected(newSelected);
    }
  };

  const openDetail = (plan: Plan) => setSelectedPlan(plan);
  const closeDetail = () => setSelectedPlan(null);

  const allSelectedIds = React.useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);
  const canAssign = allSelectedIds.length > 0 && !!selectedEndUser && !assigning;

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  async function assignEndUser() {
    try {
      if (!selectedEndUser || allSelectedIds.length === 0) return;
      setAssigning(true);
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
    
      await Promise.all(
        allSelectedIds.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/planning/${id}/end-user`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ endUserId: selectedEndUser }),
          })
        )
      );
      
      // Refresh plans after assign
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/planning/team-leader/plans`, { 
        headers, 
        cache: "no-store" 
      });
      const data = await res.json();
      const items: Plan[] = Array.isArray(data?.items) ? data.items : [];
      setPlans(items);
      
      // Clear selections
      setSelected({});
      setSelectedEndUser("");
    } catch (e: any) {
      setError(e?.message || "Failed to assign end user");
    } finally {
      setAssigning(false);
    }
  }

  const handleDelete = async (planId: string) => {
    // Implement delete functionality
    console.log("Delete plan:", planId);
    closeDetail();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="space-y-6 p-6 bg-white">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Team Plans</h1>
            <p className="text-slate-600 mt-2">Manage and assign plans to your team members</p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-slate-600">
              {plans.length} plan{plans.length !== 1 ? 's' : ''} total
            </span>
          </div>
        </div>

        {/* Assignment Panel */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assign Selected Plans to End User
                </label>
                <Select value={selectedEndUser} onValueChange={setSelectedEndUser}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Choose end user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {endUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || u.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                disabled={!canAssign} 
                onClick={assignEndUser}
                className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  `Assign ${allSelectedIds.length} Plan${allSelectedIds.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
            {allSelectedIds.length > 0 && (
              <div className="mt-3 text-sm text-blue-700">
                {allSelectedIds.length} plan{allSelectedIds.length !== 1 ? 's' : ''} selected for assignment
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search plans by title, description, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Selection */}
        {filteredPlans.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="flex items-center gap-2"
            >
              {allSelectedIds.length === filteredPlans.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {allSelectedIds.length === filteredPlans.length ? 'Deselect All' : 'Select All'}
            </Button>
            {allSelectedIds.length > 0 && (
              <span className="text-sm text-slate-600">
                {allSelectedIds.length} of {filteredPlans.length} selected
              </span>
            )}
          </div>
        )}

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
            <span className="text-slate-600">Loading plans...</span>
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
                className="shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border hover:border-blue-300 bg-white"
                onClick={() => openDetail(plan)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 text-lg mb-2 line-clamp-2">
                        {plan.title}
                      </div>
                      {plan.description ? (
                        <div className="text-sm text-slate-600 line-clamp-3 mb-3">
                          {plan.description}
                        </div>
                      ) : null}
                    </div>
                    <div 
                      className="flex-shrink-0 mt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        checked={!!selected[plan.id]}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggle(plan.id);
                        }}
                        aria-label={`Select plan ${plan.title}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {plan.status && (
                      <Badge variant="secondary" className={getStatusColor(plan.status)}>
                        {plan.status}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(plan.createdAt)}
                    </div>
                    <div className="flex items-center gap-1 text-blue-600">
                      <Eye className="w-3 h-3" />
                      View details
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Plan Detail Sheet - Centered */}
      <Sheet open={!!selectedPlan} onOpenChange={(open) => !open && closeDetail()}>
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