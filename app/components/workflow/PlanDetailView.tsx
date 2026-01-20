"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserRoles } from "@/app/lib/auth";
import { 
  Calendar, 
  Pencil, 
  Trash2, 
  FileText, 
  User, 
  Users, 
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Building,
  Crown,
  Shield,
  Briefcase,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { getDepartmentInfo } from "@/app/lib/session";

type PlanDetailViewProps = {
  plan: any;
  onDeleteAction: (id: string) => Promise<void> | void;
  onEditAction?: (plan: any) => void;
};

type CommentsData = {
  teamLeaderComment?: string;
  departmentHeadComment?: string;
  planAndStrategiesComment?: string;
};

export default function PlanDetailView({ plan, onEditAction, onDeleteAction }: PlanDetailViewProps) {
  const router = useRouter();
  const roles = getCurrentUserRoles();
  
  // State for fetched comments and loading
  const [fetchedComments, setFetchedComments] = React.useState<CommentsData | null>(null);
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);
  
  // Check if user is End_user - using the normalized frontend role "employee"
  const isEndUser = React.useMemo(() => {
    const userRoles = (roles || []).map((x: string) => String(x).toLowerCase());
    return userRoles.includes("employee");
  }, [roles]);

  const canViewReport = React.useMemo(() => {
    const r = (roles || []).map((x: string) => String(x).toLowerCase());
    return r.includes("department_head") || r.includes("team_leader") || r.includes("manager");
  }, [roles]);

  const formatDate = (iso?: string) => {
    if (!iso) return "N/A";
    try {
      return new Date(iso).toLocaleDateString("en-GB");
    } catch {
      return iso;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'in progress': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Function to fetch comments from backend
const fetchComments = async (planId: string) => {
  try {
      setIsLoadingComments(true);
      const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") ||
              localStorage.getItem("jwt") ||
              localStorage.getItem("token")
            : null;
    const response = await fetch(`http://localhost:4000/api/planning/reports/by-plan/${planId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    const planData = await response.json();
    console.log("Fetched plan data:", planData);

    setFetchedComments({
      teamLeaderComment: planData.teamLeaderComment ?? null,
      departmentHeadComment: planData.departmentHeadComment ?? null,
      planAndStrategiesComment: planData.planAndStrategiesComment ?? null,
    });

    return planData;
  } catch (error) {
    console.error("Error fetching comments:", error);
  } finally {
    setIsLoadingComments(false);
  }
};
  // Determine if the logged-in user's department is Planning & Strategies using session helper
  const [isPlanStrategyDept, setIsPlanStrategyDept] = React.useState(false);
  React.useEffect(() => {
    console.log("my plan for thsi page is ",plan)
    if (typeof window === 'undefined') return;
    const { name } = getDepartmentInfo();
    const dept = String(name || '').toLowerCase();
    const isPlanDept = dept.includes('plan') || dept.includes('strateg');
    setIsPlanStrategyDept(isPlanDept);
  }, []);

  // Use either fetched comments or existing comments
  const displayComments = fetchedComments || plan.latestReportComments;

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="w-16 h-16 text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-600 mb-2">No Plan Selected</h3>
        <p className="text-slate-500">Select a plan to view its details</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4 pb-6 border-b border-slate-200">
        <div className="flex justify-center">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            {plan.title || "Untitled Plan"}
          </h1>
          {plan.titleAm && (
            <p className="text-lg text-slate-600 font-medium">{plan.titleAm}</p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Badge className={`${getStatusColor(plan.status)} border px-3 py-1.5 font-medium`}>
            {getStatusIcon(plan.status)}
            <span className="ml-1.5">{plan.status || "Unknown"}</span>
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5 font-medium">
            <Target className="w-4 h-4 mr-1.5" />
            {plan.type || "No Type"}
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5 font-medium">
            <Clock className="w-4 h-4 mr-1.5" />
            {plan.period || "No Period"}
          </Badge>
        </div>
      </div>

      {/* Description */}
      {plan.description && (
        <Card className="border-0 shadow-sm bg-slate-50/50">
          <CardContent className="p-4">
            <p className="text-slate-700 leading-relaxed">{plan.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dates Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">Start Date</span>
              <span className="text-sm font-semibold text-blue-700">
                {formatDate(plan.startDate)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">End Date</span>
              <span className="text-sm font-semibold text-green-700">
                {formatDate(plan.endDate)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Team Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Team & Department
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.departmentName && (
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <Building className="w-4 h-4 text-slate-500" />
                <div>
                  <div className="text-xs text-slate-500">Department</div>
                  <div className="text-sm font-medium text-slate-800">{plan.departmentName}</div>
                </div>
              </div>
            )}
            {plan.departmentHeadName && (
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <Crown className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="text-xs text-slate-500">Department Head</div>
                  <div className="text-sm font-medium text-slate-800">{plan.departmentHeadName}</div>
                </div>
              </div>
            )}
            {plan.teamLeaderName && (
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <Shield className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="text-xs text-slate-500">Team Leader</div>
                  <div className="text-sm font-medium text-slate-800">{plan.teamLeaderName}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comments Card - Always show if there are comments or if user is End_user */}
      {(displayComments || isEndUser) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Latest Comments
                {fetchedComments && (
                  <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                    Updated
                  </Badge>
                )}
              </div>
              {isEndUser && (
                <Button
                  onClick={() => fetchComments(plan.id)}
                  variant="outline"
                  size="sm"
                  disabled={isLoadingComments}
                  className="h-8 px-3 text-xs border-green-500 text-green-600 hover:bg-green-50"
                >
                  {isLoadingComments ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span className="ml-1">Refresh</span>
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-xs text-slate-500">Team Leader</div>
                <textarea
                  readOnly
                  value={displayComments?.teamLeaderComment || ''}
                  placeholder="No comment"
                  className="w-full p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-slate-700 resize-none"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs text-slate-500">Department Head</div>
                <textarea
                  readOnly
                  value={displayComments?.departmentHeadComment || ''}
                  placeholder="No comment"
                  className="w-full p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-slate-700 resize-none"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs text-slate-500">Planning & Strategies</div>
                <textarea
                  readOnly
                  value={displayComments?.planAndStrategiesComment || ''}
                  placeholder="No comment"
                  className="w-full p-3 bg-violet-50 rounded-lg border border-violet-200 text-sm text-slate-700 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* People Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Employee Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Assigned To
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plan.endUserName ? (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                <User className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-xs text-indigo-600">Employee</div>
                  <div className="text-sm font-semibold text-indigo-800">{plan.endUserName}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500">
                <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <div className="text-sm">No employee assigned</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Plan Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plan.ownerName ? (
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-xs text-purple-600">Owner</div>
                  <div className="text-sm font-semibold text-purple-800">{plan.ownerName}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <div className="text-sm">No owner assigned</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tasks Section */}
      {plan.tasks && plan.tasks.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Tasks ({plan.tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {plan.tasks.map((task: string, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-sm text-slate-700 leading-relaxed">{task}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Attachment */}
      {plan.fileUrl && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={plan.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Download Attached File
            </a>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons - Centered (Plan & Report actions removed) */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => onEditAction && onEditAction(plan)}
            variant="outline"
            className="h-10 w-10 p-0 border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-600 hover:text-yellow-700 rounded-xl"
            title="Edit"
            aria-label="Edit Plan"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => onDeleteAction(plan.id)}
            variant="outline"
            className="h-10 w-10 p-0 border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 hover:text-red-700 rounded-xl"
            title="Delete"
            aria-label="Delete Plan"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="text-center text-xs text-slate-500 pt-4">
        {plan.createdAt && (
          <p>Created on {formatDate(plan.createdAt)}</p>
        )}
        {plan.updatedAt && plan.updatedAt !== plan.createdAt && (
          <p>Last updated on {formatDate(plan.updatedAt)}</p>
        )}
      </div>
    </div>
  );
}