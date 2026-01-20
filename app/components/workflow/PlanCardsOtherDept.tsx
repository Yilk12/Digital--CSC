"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { FileText, Calendar, BadgeCheck, User, Send, Loader2, CheckCircle2, Users, Filter, Search, Download } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { toast } from "@/app/components/ui/use-toast";
import { Sheet as UISheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import PlanDetailView from "./PlanDetailView";

export type PlanItem = {
  id: string;
  title: string;
  description?: string | null;
  period: string;
  startDate?: string;
  endDate?: string;
  status?: string | null;
  fileUrl?: string | null;
  type?: string | null;
};

function formatDate(iso?: string) {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleDateString("en-GB");
  } catch {
    return iso;
  }
}

const getStatusColor = (status?: string | null) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function PlanCardsOtherDept() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [teamLeaders, setTeamLeaders] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [selectedLeader, setSelectedLeader] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [assigning, setAssigning] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

  // ✅ Fetch plans for department
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token");

        const res = await fetch("http://localhost:4000/api/Planning/department", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) throw new Error(`Failed to fetch plans (${res.status})`);

        const data = await res.json();
        console.log("Fetched data:", data);

        // ✅ Set plans correctly from data.items
        setPlans(Array.isArray(data.items) ? data.items : []);
      } catch (err: any) {
        toast({ 
          title: "Error Loading Plans", 
          description: err.message, 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // ✅ Fetch available team leaders (from Planning module)
  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token");

        const res = await fetch("http://localhost:4000/api/Planning/team-leaders", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Failed to load team leaders");
        const raw = await res.json();
        // Backend returns array of users with { id, firstName, lastName, email, departmentId }
        const mapped = Array.isArray(raw)
          ? raw.map((u: any) => ({ id: u.id, name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(), email: u.email }))
          : [];
        setTeamLeaders(mapped);
      } catch (err: any) {
        toast({ 
          title: "Error", 
          description: err?.message || "Could not load team leaders",
          variant: "destructive" 
        });
      }
    };
    fetchLeaders();
  }, []);

  // ✅ Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const openDetailPane = (plan: any) => {
    setSelectedPlan(plan);
    setOpenDetail(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/planning/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`Failed to delete plan (${res.status})`);
      setPlans(prev => prev.filter(p => p.id !== id));
      setOpenDetail(false);
      setSelectedPlan(null);
      toast({ title: "Plan deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  // ✅ Handle bulk assignment
  const handleAssign = async () => {
    if (!selectedLeader) {
      toast({ 
        title: "Select Team Leader", 
        description: "Please select a team leader first",
        variant: "destructive" 
      });
      return;
    }
    if (selected.size === 0) {
      toast({ 
        title: "No Plans Selected", 
        description: "Please select at least one plan to assign",
        variant: "destructive" 
      });
      return;
    }

    try {
      setAssigning(true);
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("token");

      // Call backend for each selected plan id
      const planIds = Array.from(selected);
      const results = await Promise.all(
        planIds.map(async (planId) => {
          const resp = await fetch(`http://localhost:4000/api/planning/${planId}/team-leader`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ teamLeaderId: selectedLeader }),
          });
          return { planId, ok: resp.ok, status: resp.status };
        })
      );

      const failed = results.filter(r => !r.ok);
      if (failed.length > 0) {
        throw new Error(`Failed ${failed.length}/${planIds.length} assignments (e.g. status ${failed[0].status})`);
      }

      toast({
        title: "✅ Assignment Successful",
        description: `${selected.size} plan(s) assigned to team leader.`,
      });

      setSelected(new Set());
      setSelectedLeader("");
    } catch (err: any) {
      toast({ 
        title: "Assignment Failed", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setAssigning(false);
    }
  };

  // Filter plans based on search and filters
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = 
      plan.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.period?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
    const matchesPeriod = periodFilter === "all" || plan.period === periodFilter;

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  // Get unique statuses and periods for filters
  const uniqueStatuses = [...new Set(plans.map(plan => plan.status).filter(Boolean))];
  const uniquePeriods = [...new Set(plans.map(plan => plan.period).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-lg font-medium text-slate-700">Loading department plans...</p>
        <p className="text-sm text-slate-500 mt-2">Please wait while we fetch your plans</p>
      </div>
    );
  }

  if (!plans.length) {
    return (
      <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No Plans Available</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            There are no plans currently assigned to your department. 
            Plans will appear here when they are created and assigned by the planning team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <Loader2 className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-indigo-600 bg-clip-text text-transparent">
          Department Plans
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Manage and assign plans to team leaders within your department
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{plans.length}</div>
            <div className="text-sm text-blue-700 font-medium">Total Plans</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {plans.filter(p => p.status?.toLowerCase() === 'completed').length}
            </div>
            <div className="text-sm text-green-700 font-medium">Completed</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {plans.filter(p => p.status?.toLowerCase() === 'in progress').length}
            </div>
            <div className="text-sm text-amber-700 font-medium">In Progress</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-600">{selected.size}</div>
            <div className="text-sm text-slate-700 font-medium">Selected</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Panel */}
      <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Assign to Team Leader</h3>
                <p className="text-sm text-slate-600">
                  {selected.size} plan(s) selected for assignment
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
              <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                <SelectTrigger className="flex-1 min-w-[200px] rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                  <SelectValue placeholder={
                    <div className="flex items-center gap-2 text-slate-500">
                      <User className="w-4 h-4" />
                      Select Team Leader
                    </div>
                  } />
                </SelectTrigger>
                <SelectContent>
                  {teamLeaders.map((tl) => (
                    <SelectItem key={tl.id} value={tl.id} className="py-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-600" />
                        <div>
                          <div className="font-medium text-slate-800">{tl.name}</div>
                          {tl.email && (
                            <div className="text-xs text-slate-500">{tl.email}</div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleAssign} 
                disabled={!selectedLeader || selected.size === 0 || assigning}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {assigning ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {assigning ? "Assigning..." : `Assign ${selected.size} Plan(s)`}
              </Button>

              {selected.size > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setSelected(new Set())}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 rounded-xl border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status!}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-40 rounded-xl border-slate-200">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {uniquePeriods.map(period => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchQuery || statusFilter !== "all" || periodFilter !== "all") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setPeriodFilter("all");
                  }}
                  className="rounded-xl text-slate-600 hover:text-slate-800"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => {
          const isSelected = selected.has(plan.id);
          return (
            <Card
              key={plan.id}
              className={`border-0 shadow-md rounded-2xl bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group ${
                isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              }`}
              onClick={() => openDetailPane(plan)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-1 rounded-lg border-2 transition-colors ${
                      isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(plan.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500"
                      />
                    </div>
                    <div className="p-2 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                        {plan.title || "Untitled Plan"}
                      </CardTitle>
                      {plan.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {plan.status && (
                    <Badge className={`${getStatusColor(plan.status)} border px-2 py-1 text-xs font-medium`}>
                      <BadgeCheck className="w-3 h-3 mr-1" />
                      {plan.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium">
                      {plan.period || "N/A"}
                    </Badge>
                    {plan.type && (
                      <Badge variant="outline" className="rounded-lg">
                        {plan.type}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{formatDate(plan.startDate)} - {formatDate(plan.endDate)}</span>
                    </div>
                    
                    {plan.fileUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty Filter Results */}
      {filteredPlans.length === 0 && plans.length > 0 && (
        <Card className="border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <Filter className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Matching Plans</h3>
            <p className="text-slate-600 mb-6">
              No plans match your current search criteria. Try adjusting your filters.
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPeriodFilter("all");
              }}
              variant="outline"
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Detail Sheet */}
       <UISheet open={openDetail} onOpenChange={setOpenDetail}>
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
       </UISheet>
    </div>
  );
}