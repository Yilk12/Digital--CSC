"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, Calendar, Building, Users, User, Lock, Plus, X, Loader2, FileText, Upload } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string;
}

async function postJson(url: string, body: any) {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token");
  const res = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export default function PlanCreateForm({ onSuccessAction }: { onSuccessAction?: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    period: "MONTHLY",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    departmentId: "",
    teamLeaderId: "",
    endUserId: ""
  });
  const [tasks, setTasks] = useState<string[]>([""]);
  const [kpis, setKpis] = useState<{ name: string; target: string; theme: string }[]>([
    { name: "", target: "", theme: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<AppUser[]>([]);
  const [endUsers, setEndUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState({
    departments: true,
    teamLeaders: false,
    endUsers: false
  });
  
  // Permission state
  const [userDepartment, setUserDepartment] = useState<string>("");
  const [isPlanStrategyDept, setIsPlanStrategyDept] = useState(false);

  // Fetch departments once on mount from the specified API and populate the select
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token");
        const res = await fetch("http://localhost:4000/api/departments?page=1&limit=1000", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error("Failed to fetch departments");
        const data = await res.json();
        // Support both shapes: { items: [...] } and { departments: [...] }
        const list = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.departments)
          ? data.departments
          : [];
        setDepartments(list);
      } catch (error) {
        setError("Failed to load departments");
      } finally {
        setLoading(prev => ({ ...prev, departments: false }));
      }
    };

    // TODO: replace this with real user department from auth context/profile
    const userDept = "Plan and Strategies"; // placeholder
    setUserDepartment(userDept);
    setIsPlanStrategyDept(userDept.toLowerCase().includes("plan") || userDept.toLowerCase().includes("strategy"));

    fetchDepartments();
  }, []);

  // After departments are loaded, if user belongs to Plan/Strategy and no department selected, auto-select matching department
  useEffect(() => {
    if (!formData.departmentId && isPlanStrategyDept && departments.length) {
      const planDept = departments.find(dept =>
        dept.name?.toLowerCase().includes("plan") || dept.name?.toLowerCase().includes("strategy")
      );
      if (planDept) {
        setFormData(prev => ({ ...prev, departmentId: planDept.id }));
      }
    }
  }, [departments, isPlanStrategyDept, formData.departmentId]);

  // Fetch team leaders when department is selected
  useEffect(() => {
    if (!formData.departmentId) {
      setTeamLeaders([]);
      setEndUsers([]);
      return;
    }

    const fetchTeamLeaders = async () => {
      setLoading(prev => ({ ...prev, teamLeaders: true }));
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token");
        const res = await fetch(`http://localhost:4000/api/users?departmentId=${formData.departmentId}&role=TEAM_LEADER`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          setTeamLeaders(Array.isArray(data.items) ? data.items : []);
        }
      } catch (error) {
        console.error("Failed to fetch team leaders");
      } finally {
        setLoading(prev => ({ ...prev, teamLeaders: false }));
      }
    };

    fetchTeamLeaders();
  }, [formData.departmentId]);

  // Fetch end users when team leader is selected
  useEffect(() => {
    if (!formData.teamLeaderId) {
      setEndUsers([]);
      return;
    }

    const fetchEndUsers = async () => {
      setLoading(prev => ({ ...prev, endUsers: true }));
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token");
        const res = await fetch(`http://localhost:4000/api/users?departmentId=${formData.departmentId}&role=EMPLOYEE`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          setEndUsers(Array.isArray(data.items) ? data.items : []);
        }
      } catch (error) {
        console.error("Failed to fetch end users");
      } finally {
        setLoading(prev => ({ ...prev, endUsers: false }));
      }
    };

    fetchEndUsers();
  }, [formData.teamLeaderId, formData.departmentId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset dependent fields when department changes
      ...(field === 'departmentId' ? { teamLeaderId: "", endUserId: "" } : {}),
      ...(field === 'teamLeaderId' ? { endUserId: "" } : {})
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        setError("Please select a PDF file only");
        e.target.value = ""; // Reset the input
      }
    }
  };

  function addTask() {
    setTasks(prev => [...prev, ""]);
  }

  function updateTask(idx: number, val: string) {
    setTasks(prev => prev.map((x, i) => (i === idx ? val : x)));
  }

  function removeTask(idx: number) {
    setTasks(prev => prev.filter((_, i) => i !== idx));
  }

  function addKpi() {
    setKpis(prev => [...prev, { name: "", target: "", theme: "" }]);
  }

  function updateKpi(idx: number, field: "name" | "target" | "theme", value: string) {
    setKpis(prev => prev.map((kpi, i) => (i === idx ? { ...kpi, [field]: value } : kpi)));
  }

  function removeKpi(idx: number) {
    setKpis(prev => prev.filter((_, i) => i !== idx));
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

  try {
    // === 1) Upload File (optional) ===
    let fileUrl: string | null = null;
    if (selectedFile) {
      const upForm = new FormData();
      upForm.append("file", selectedFile);

      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("token");

      const uploadRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload/pdf`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: upForm,
        }
      );

      if (!uploadRes.ok) {
        throw new Error(`File upload failed (${uploadRes.status})`);
      }

      const uploadJson = await uploadRes.json();
      fileUrl = uploadJson?.url || null;
      console.log("our url is",fileUrl)
    }

    // === 2) Build payload exactly as backend expects ===
    const rawPayload = {
      title: formData.title?.trim(),
      description: formData.description?.trim(),
      period: formData.period, // 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      status: "DRAFT",
      fileUrl: fileUrl || undefined,
      departmentId: formData.departmentId || undefined,
      teamLeaderId: formData.teamLeaderId || undefined,
      endUserId: formData.endUserId || undefined,
      tasks: tasks.filter((t) => t.trim().length > 0),
      kpis: kpis
        .map(k => ({ name: k.name.trim(), target: k.target.trim(), theme: k.theme.trim() }))
        .filter(k => k.name || k.target || k.theme),
    };

    // Remove undefined fields before sending
    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(([_, v]) => v !== undefined && v !== null)
    );

    // === 3) Send plan JSON ===
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("token");

    console.log("Final Payload to Backend:", payload);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/planning`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);

    await res.json();
    onSuccessAction?.();

    // === 4) Reset form ===
    setFormData({
      title: "",
      description: "",
      period: "MONTHLY",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      departmentId: "",
      teamLeaderId: "",
      endUserId: ""
    });
    setTasks([""]);
    setKpis([{ name: "", target: "", theme: "" }]);
    setSelectedFile(null);
  } catch (err: any) {
    setError(err?.message || "Failed to create plan");
  } finally {
    setSubmitting(false);
  }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-600" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="xl:col-span-2">
            <Label htmlFor="title" className="text-sm font-medium text-slate-700 mb-2 block">
              Plan Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter plan title"
              className="w-full rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-3 text-base"
              required
            />
          </div>

          <div className="xl:col-span-2">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700 mb-2 block">
              Corporate Plan Guidelines (Summary for Departments)
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter key guidance, strategic priorities, and planning instructions here..."
              rows={12}
              className="w-full rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 p-3 resize-none text-base"
            />
          </div>

          {/* Plan Period and Dates */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="period" className="text-sm font-medium text-slate-700 mb-2 block">
                Plan Period
              </Label>
              <Select value={formData.period} onValueChange={(value) => handleInputChange("period", value)}>
                <SelectTrigger className="w-full rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-3 text-base">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"].map((period) => (
                    <SelectItem key={period} value={period} className="text-base py-2">
                      {period.charAt(0) + period.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate" className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                Start Date *
              </Label>
              <Input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className="w-full rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-3 text-base"
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                End Date *
              </Label>
              <Input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className="w-full rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-3 text-base"
                required
              />
            </div>
          </div>

          {/* Department & PDF */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="department" className="text-sm font-medium text-slate-700 mb-2 block">
                Department *
                {isPlanStrategyDept && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-green-100 text-green-800 border-green-200 text-xs"
                  >
                    Editable
                  </Badge>
                )}
              </Label>
              {loading.departments ? (
                <div className="flex items-center gap-2 text-slate-500 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading departments...
                </div>
              ) : (
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => handleInputChange("departmentId", value)}
                >
                  <SelectTrigger className="w-full rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-3 text-base">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id} className="text-base py-2">
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Attach PDF File</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="cursor-default">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="text-sm text-slate-600 mb-1">
                    {selectedFile ? selectedFile.name : "Choose PDF file from your computer"}
                  </div>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Browse Files
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">Only PDF files are accepted</p>
                </div>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded-lg">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">{selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-600 hover:text-red-700 ml-auto"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Team Assignment & Tasks (hidden for Plan/Strategy dept) */}
      {!isPlanStrategyDept && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Team Assignment & Tasks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Team Leader</Label>
              {loading.teamLeaders ? (
                <div className="flex items-center gap-2 text-slate-500 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading team leaders...
                </div>
              ) : (
                <Select
                  value={formData.teamLeaderId}
                  onValueChange={(value) => handleInputChange("teamLeaderId", value)}
                >
                  <SelectTrigger className="w-full rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-3 text-base">
                    <SelectValue placeholder="Select team leader" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamLeaders.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-base py-2">
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Responsible Employee</Label>
              {loading.endUsers ? (
                <div className="flex items-center gap-2 text-slate-500 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading employees...
                </div>
              ) : (
                <Select
                  value={formData.endUserId}
                  onValueChange={(value) => handleInputChange("endUserId", value)}
                >
                  <SelectTrigger className="w-full rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-3 text-base">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {endUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-base py-2">
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Tasks & Activities</span>
            </div>
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={task}
                    onChange={(e) => updateTask(index, e.target.value)}
                    placeholder={`Task / Activity #${index + 1}`}
                    className="flex-1 rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  />
                  {tasks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                onClick={addTask}
                variant="outline"
                className="rounded-xl text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Task / Activity
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Lock className="w-5 h-5 text-indigo-600" />
          Corporate KPIs / Targets
        </h3>

        <div className="space-y-5">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-semibold text-slate-800">
                  Corporate KPI #{index + 1}
                </span>
                {kpis.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKpi(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" /> Remove
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">
                    Corporate KPI Name
                  </Label>
                  <Input
                    value={kpi.name}
                    onChange={(e) => updateKpi(index, "name", e.target.value)}
                    placeholder="KPI Name (e.g., Annual Revenue Growth)"
                    className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">
                    Annual Target
                  </Label>
                  <Input
                    value={kpi.target}
                    onChange={(e) => updateKpi(index, "target", e.target.value)}
                    placeholder="Target value (e.g., 10%)"
                    className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">
                    Strategic Priority / Theme
                  </Label>
                  <Input
                    value={kpi.theme}
                    onChange={(e) => updateKpi(index, "theme", e.target.value)}
                    placeholder="e.g., Digital Transformation"
                    className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            onClick={addKpi}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Another KPI / Target
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <Button
          type="submit"
          disabled={submitting}
          className="px-8 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating Plan...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Create Plan
            </>
          )}
        </Button>
      </div>
    </form>
  </div>
  );
}
