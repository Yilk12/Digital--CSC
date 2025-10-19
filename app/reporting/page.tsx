"use client"

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalization } from "@/hooks/use-localization";
import { getCurrentUserPrimaryRole, getCurrentUserRoles, type UserRole } from "@/app/lib/auth";
import { apiFetchLocal } from "@/app/lib/http";
import UserSelect, { type SimpleUser } from "@/components/users/UserSelect";

// Types
interface ReportItem {
  id: string;
  title: string;
  department: string;
  category: string;
  status?: string; // Submitted | Needs Edits | Dept Approved | Rejected
  ownerId?: string;
  description?: string;
}

// Demo users; replace with API-driven users when available
const demoUsers: SimpleUser[] = [
  { id: 'USR-001', name: 'Dr. Alemayehu Tadesse', email: 'alemayehu.tadesse@csc.gov.et', role: 'Commissioner' },
  { id: 'USR-002', name: 'Meron Bekele', email: 'meron.bekele@csc.gov.et', role: 'Department Manager / Head' },
  { id: 'USR-003', name: 'John Doe', email: 'john.doe@csc.gov.et', role: 'Project Manager' },
  { id: 'USR-004', name: 'Sarah Wilson', email: 'sarah.wilson@csc.gov.et', role: 'Team Leaders / Supervisors' },
  { id: 'USR-005', name: 'Ahmed Hassan', email: 'ahmed.hassan@ministry.gov.et', role: 'Employees / Staff Members' },
  { id: 'USR-006', name: 'Hanna Getachew', email: 'hanna.getachew@csc.gov.et', role: 'Planning/Strategy Officer' },
  { id: 'USR-007', name: 'Lemma Worku', email: 'lemma.worku@csc.gov.et', role: 'Human Resources (HR)' },
  { id: 'USR-008', name: 'Biruk Kebede', email: 'biruk.kebede@csc.gov.et', role: 'Finance Officer / Budget Analyst' },
];

export default function ReportingPage() {
  const { t } = useLocalization();

  // Determine roles and primary role on the client
  const roles = React.useMemo(() => getCurrentUserRoles(), []);
  const primaryRole = React.useMemo(() => getCurrentUserPrimaryRole(), []);
  const hasRole = React.useCallback((r: UserRole) => roles.includes(r), [roles]);

  // Tab default based on primary role
  const isCommissioner = React.useMemo(() => {
    const lower = roles.map((r) => String(r).toLowerCase())
    return lower.includes("general_director")
  }, [roles])
  const defaultTab = React.useMemo(() => {
    if (isCommissioner) return "commissioner";
    if (primaryRole === "department_head") return "department-head";
    if (primaryRole === "manager" || primaryRole === "gm") return "manager-gm";
    if (primaryRole === "admin") return "admin";
    return "employee";
  }, [primaryRole, isCommissioner]);

  // Form state
  const [title, setTitle] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // In-page interface rendering state
  const [selectedInterface, setSelectedInterface] = React.useState<string | null>(null);
  const [interfaceType, setInterfaceType] = React.useState<string>("");
  const interfaceRef = React.useRef<HTMLDivElement>(null);

  const openSelectedInterface = () => {
    if (!category) return;
    setSelectedInterface("Sent Report");
    setInterfaceType(category);
    setTimeout(() => interfaceRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  // Abuse report state
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const [reportTargetType, setReportTargetType] = React.useState<'user' | 'message' | 'group'>('message');
  const [reportTargetId, setReportTargetId] = React.useState('');
  const [reportReason, setReportReason] = React.useState('spam');
  const [reportDescription, setReportDescription] = React.useState('');
  const [myReports, setMyReports] = React.useState<any[]>([]);
  const [modReports, setModReports] = React.useState<any[]>([]);
  const [modFilterStatus, setModFilterStatus] = React.useState<string>('');
  const [modFilterType, setModFilterType] = React.useState<string>('');
  // Role assignments panel state (local only)
  const PLANNING_ROLES: string[] = [
    'Department Manager / Head',
    'Team Leaders / Supervisors',
    'Employees / Staff Members',
    'Planning/Strategy Officer',
    'Human Resources (HR)',
    'Finance Officer / Budget Analyst',
    'Project Manager',
    'Commissioner',
  ];
  const [reportOwnerId, setReportOwnerId] = React.useState<string | null>(null);
  const [reportAssignments, setReportAssignments] = React.useState<Record<string, string | null>>({});

  // Group report inline form state
  const [groupTargetId, setGroupTargetId] = React.useState('');
  const [groupReason, setGroupReason] = React.useState('spam');
  const [groupDescription, setGroupDescription] = React.useState('');
  const [groups, setGroups] = React.useState<Array<{ id: string; name?: string }>>([]);

  const loadGroups = React.useCallback(async () => {
    try {
      const res = await apiFetchLocal('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        const filtered = arr.filter((c: any) => c?.type === 'GROUP' || c?.type === 'DEPARTMENT');
        setGroups(filtered);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    // Load groups once for the picker
    loadGroups();
  }, [loadGroups]);

  const currentUserId = React.useMemo(() => {
    try {
      const fromStorage = typeof window !== 'undefined' ? window.localStorage.getItem('userId') : null;
      return fromStorage || '1';
    } catch {
      return '1';
    }
  }, []);

  // Submissions state (simple in-page store)
  const [submissions, setSubmissions] = React.useState<ReportItem[]>([]);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDepartment, setEditDepartment] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");

  const loadMyReports = React.useCallback(async () => {
    try {
      const res = await apiFetchLocal(`/api/abuse-reports?reporter_id=${encodeURIComponent(currentUserId)}`);
      if (res.ok) {
        const data = await res.json();
        setMyReports(data);
      }
    } catch {}
  }, [currentUserId]);

  const loadModReports = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('all', '1');
      if (modFilterStatus) params.set('status', modFilterStatus);
      if (modFilterType) params.set('target_type', modFilterType);
      const res = await apiFetchLocal(`/api/abuse-reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setModReports(data);
      }
    } catch {}
  }, [modFilterStatus, modFilterType]);

  React.useEffect(() => {
    loadMyReports();
  }, [loadMyReports]);

  React.useEffect(() => {
    if (hasRole('admin')) loadModReports();
  }, [hasRole, loadModReports]);

  // Prefill report modal from URL query (?target_type=message&target_id=123)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const tt = url.searchParams.get('target_type') as 'user' | 'message' | 'group' | null;
    const tid = url.searchParams.get('target_id');
    if (tt && tid) {
      setReportTargetType(tt);
      setReportTargetId(tid);
      setIsReportOpen(true);
    }
  }, []);

  // Mock data and pagination
  const mockReports: ReportItem[] = React.useMemo(
    () => [
      { id: "r1", title: "Monthly IT Incident Summary", department: "IT", category: "Incident", status: "Submitted" },
      { id: "r2", title: "Q2 Procurement Overview", department: "Finance", category: "Procurement", status: "Dept Approved" },
      { id: "r3", title: "Ops Efficiency Update", department: "Operations", category: "Performance", status: "Submitted" },
      { id: "r4", title: "HR Onboarding Review", department: "HR", category: "Other", status: "Submitted" },
      { id: "r5", title: "IT Procurement Summary", department: "IT", category: "Procurement", status: "Submitted" },
    ],
    []
  );

  const [employeePage, setEmployeePage] = React.useState(1);
  const employeePageSize = 5;
  const employeeData = React.useMemo(() => {
    const start = (employeePage - 1) * employeePageSize;
    return { items: mockReports.slice(start, start + employeePageSize), total: mockReports.length };
  }, [employeePage, employeePageSize, mockReports]);

  const [deptPage, setDeptPage] = React.useState(1);
  const deptData = React.useMemo(() => {
    // For demo, reuse mockReports
    const start = (deptPage - 1) * 5;
    return { items: mockReports.slice(start, start + 5), total: mockReports.length };
  }, [deptPage, mockReports]);

  const [mgrPage, setMgrPage] = React.useState(1);
  const mgrData = React.useMemo(() => {
    // For demo, reuse mockReports
    const start = (mgrPage - 1) * 5;
    return { items: mockReports.slice(start, start + 5), total: mockReports.length };
  }, [mgrPage, mockReports]);

  // Report categories interfaces (like My Submissions)
  const reportCategories = React.useMemo(
    () => [
      "Daily Report",
      "Weekly Report",
      "Monthly Report",
      "First Quarter Report",
      "Second Quarter Report",
      "Third Quarter Report",
      "Fourth Quarter Report",
      "Six Month Report",
      "Yearly Report",
    ],
    []
  );

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = t("form.title") + " " + t("validation.required");
    if (!department) e.department = t("form.department") + " " + t("validation.required");
    if (!category) e.category = t("form.category") + " " + t("validation.required");
    if (description.trim().length < 20) e.description = t("form.description") + ": " + t("message.too_short");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const newItem: ReportItem = {
      id: `sub-${Date.now()}`,
      title,
      department,
      category,
      description,
      status: "Submitted",
      ownerId: currentUserId,
    };
    setSubmissions((prev) => [newItem, ...prev]);
    alert(t("message.submitted"));
    // Reset form
    setTitle("");
    setDepartment("");
    setCategory("");
    setDescription("");
  }

  // Action handlers (mock)
  const approve = (id: string) => {
    setSubmissions((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Dept Approved" } : r)));
    alert(`Approved: ${id}`);
  };
  const reject = (id: string) => {
    setSubmissions((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Rejected" } : r)));
    alert(`Rejected: ${id}`);
  };
  const requestEdits = (id: string) => {
    setSubmissions((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Needs Edits" } : r)));
    alert(`Requested edits: ${id}`);
  };
  const forward = (id: string, to: "manager" | "gm") => alert(`Forwarded ${id} to ${to}`);
  const archive = (id: string) => alert(`Archived: ${id}`);

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: 1100 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}>{t("reporting.title")}</h1>
          <p style={{ color: "#555", marginBottom: 24 }}>{t("reporting.subtitle")}</p>

          {/* Report Form Modal */}
          {isReportOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', borderRadius: 8, padding: 16, width: 520, maxWidth: '92vw' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Report Content</h3>
                  <button style={ghostBtn} onClick={() => setIsReportOpen(false)}>Close</button>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Target Type</label>
                    <select value={reportTargetType} onChange={(e) => setReportTargetType(e.target.value as any)} style={inputStyle}>
                      <option value="message">Message</option>
                      <option value="user">User</option>
                      <option value="group">Group</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Target ID</label>
                    <input value={reportTargetId} onChange={(e) => setReportTargetId(e.target.value)} placeholder="Enter target ID" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Reason</label>
                    <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} style={inputStyle}>
                      <option value="spam">Spam</option>
                      <option value="harassment">Harassment</option>
                      <option value="hate_speech">Hate Speech</option>
                      <option value="impersonation">Impersonation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Description (optional)</label>
                    <textarea rows={4} value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder="Add additional context" style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      style={primaryBtn}
                      onClick={async () => {
                        try {
                          const res = await apiFetchLocal('/api/abuse-reports', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              reporter_id: currentUserId,
                              target_type: reportTargetType,
                              target_id: reportTargetId,
                              reason: reportReason,
                              description: reportDescription,
                            }),
                          });
                          if (res.ok) {
                            setIsReportOpen(false);
                            setReportDescription('');
                            setReportTargetId('');
                            await loadMyReports();
                            alert('Report submitted');
                          } else {
                            const j = await res.json().catch(() => ({}));
                            alert(j.error || 'Failed to submit report');
                          }
                        } catch (e) {
                          alert('Failed to submit report');
                        }
                      }}
                    >
                      Submit Report
                    </button>
                    <button style={ghostBtn} onClick={() => setIsReportOpen(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList>
              {!isCommissioner && (
                <TabsTrigger value="employee">{t("reporting.employee")}</TabsTrigger>
              )}
              {hasRole("department_head") && (
                <TabsTrigger value="department-head">{t("reporting.department_head")}</TabsTrigger>
              )}
              {(hasRole("manager") || hasRole("gm")) && (
                <TabsTrigger value="manager-gm">{t("reporting.manager_gm")}</TabsTrigger>
              )}
              {hasRole("admin") && (
                <TabsTrigger value="admin">{t("reporting.admin")}</TabsTrigger>
              )}
              {isCommissioner && (
                <TabsTrigger value="commissioner">Commissioner</TabsTrigger>
              )}
            </TabsList>

            {/* Employee (own reports only) */}
            <TabsContent value="employee">
              <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 }}>
                <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12 }}>{t("reporting.submit_report")}</h2>
                  <form onSubmit={submitReport}>
                    <div style={{ display: "grid", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>{t("form.title")}</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" required placeholder={t("reporting.placeholders.title")!} style={inputStyle} />
                        {errors.title && <div style={errorText}>{errors.title}</div>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>{t("form.department")}</label>
                          <select value={department} onChange={(e) => setDepartment(e.target.value)} required style={inputStyle}>
                            <option value="">{t("reporting.placeholders.department")}</option>
                            <option>HR</option>
                            <option>Finance</option>
                            <option>IT</option>
                            <option>Operations</option>
                          </select>
                          {errors.department && <div style={errorText}>{errors.department}</div>}
                        </div>
                        <div>
                          <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>{t("form.category")}</label>
                          <select value={category} onChange={(e) => setCategory(e.target.value)} required style={inputStyle}>
                            <option value="">{t("reporting.placeholders.category")}</option>
                            <option>Daily Report</option>
                            <option>Weekly Report</option>
                            <option>Monthly Report</option>
                            <option>First Quarter Report</option>
                            <option>Second Quarter Report</option>
                            <option>Third Quarter Report</option>
                            <option>Fourth Quarter Report</option>
                            <option>Six Month Report</option>
                            <option>Yearly Report</option>
                          </select>
                          {errors.category && <div style={errorText}>{errors.category}</div>}
                          {category && (
                            <div style={{ marginTop: 8 }}>
                              <button type="button" style={ghostBtn} onClick={openSelectedInterface}>Open {category} Interface</button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>{t("form.description")}</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required placeholder={t("reporting.placeholders.description")!} rows={6} style={inputStyle} />
                        {errors.description && <div style={errorText}>{errors.description}</div>}
                      </div>
                      <div>
                        <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>{t("reporting.attachments")}</label>
                        <input type="file" multiple />
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button type="submit" style={primaryBtn}>{t("reporting.submit_to_head")}</button>
                        <button type="button" style={ghostBtn} onClick={() => alert(t("message.saved_draft"))}>{t("reporting.save_draft")}</button>
                      </div>
                    </div>
                  </form>
                </div>
                {/* Group Report Form */}
                <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12 }}>Group Report</h2>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!groupTargetId.trim()) {
                        alert('Please provide a Group ID');
                        return;
                      }
                      try {
                        const res = await apiFetchLocal('/api/abuse-reports', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            reporter_id: currentUserId,
                            target_type: 'group',
                            target_id: groupTargetId.trim(),
                            reason: groupReason,
                            description: groupDescription,
                          }),
                        });
                        if (res.ok) {
                          setGroupTargetId('');
                          setGroupReason('spam');
                          setGroupDescription('');
                          await loadMyReports();
                          alert('Group report submitted');
                        } else {
                          const j = await res.json().catch(() => ({}));
                          alert(j.error || 'Failed to submit group report');
                        }
                      } catch (err) {
                        alert('Failed to submit group report');
                      }
                    }}
                  >
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Select Group</label>
                        <select
                          value={groupTargetId}
                          onChange={(e) => setGroupTargetId(e.target.value)}
                          style={inputStyle}
                        >
                          <option value="">-- Choose a group/conversation --</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name || `Conversation ${g.id.slice(0, 8)}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Group ID</label>
                        <input
                          value={groupTargetId}
                          onChange={(e) => setGroupTargetId(e.target.value)}
                          placeholder="Enter group/conversation ID"
                          style={inputStyle}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Reason</label>
                        <select value={groupReason} onChange={(e) => setGroupReason(e.target.value)} style={inputStyle}>
                          <option value="spam">Spam</option>
                          <option value="harassment">Harassment</option>
                          <option value="hate_speech">Hate Speech</option>
                          <option value="impersonation">Impersonation</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Description (optional)</label>
                        <textarea
                          rows={5}
                          value={groupDescription}
                          onChange={(e) => setGroupDescription(e.target.value)}
                          placeholder="Describe the issue or provide context"
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button type="submit" style={primaryBtn}>Submit Group Report</button>
                        <button
                          type="button"
                          style={ghostBtn}
                          onClick={() => { setGroupTargetId(''); setGroupReason('spam'); setGroupDescription(''); }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </section>

              {/* My Submissions (Employee only own) */}
              <section style={{ marginTop: 24, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>My Submissions</h2>
                {submissions.filter(s => s.ownerId === currentUserId).length === 0 ? (
                  <p style={{ color: "#666" }}>No submissions yet.</p>
                ) : (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                    {submissions.filter(s => s.ownerId === currentUserId).map((s) => (
                      <li key={s.id} style={listItem}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.title}</div>
                          <div style={{ fontSize: 12, color: "#666" }}>Dept: {s.department} • Category: {s.category}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: s.status === 'Needs Edits' ? '#a16207' : s.status === 'Dept Approved' ? '#166534' : s.status === 'Rejected' ? '#b91c1c' : '#6b7280' }}>{s.status}</span>
                          {s.status === 'Needs Edits' && (
                            <button
                              style={ghostBtn}
                              onClick={() => {
                                setEditId(s.id);
                                setEditTitle(s.title);
                                setEditDepartment(s.department);
                                setEditCategory(s.category);
                                setEditDescription(s.description || '');
                                setIsEditOpen(true);
                              }}
                            >
                              Edit & Resubmit
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Edit & Resubmit Modal */}
              {isEditOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ background: '#fff', borderRadius: 8, padding: 16, width: 560, maxWidth: '92vw' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Edit & Resubmit</h3>
                      <button style={ghostBtn} onClick={() => setIsEditOpen(false)}>Close</button>
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Title</label>
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Department</label>
                          <select value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} style={inputStyle}>
                            <option value="">Select department</option>
                            <option>HR</option>
                            <option>Finance</option>
                            <option>IT</option>
                            <option>Operations</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Category</label>
                          <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={inputStyle}>
                            <option value="">Select category</option>
                            {reportCategories.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Description</label>
                        <textarea rows={5} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          style={primaryBtn}
                          onClick={() => {
                            if (!editId) return;
                            setSubmissions(prev => prev.map(r => r.id === editId ? { ...r, title: editTitle, department: editDepartment, category: editCategory, description: editDescription, status: 'Submitted' } : r));
                            setIsEditOpen(false);
                            alert('Resubmitted for review');
                          }}
                        >
                          Resubmit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </TabsContent>

            {isCommissioner && (
              <TabsContent value="commissioner">
                <section style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>All Reports</h2>
                  {submissions.length === 0 ? (
                    <p style={{ color: "#666" }}>No submissions available.</p>
                  ) : (
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                      {submissions.map((s) => (
                        <li key={s.id} style={listItem}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.title}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>Dept: {s.department} • Category: {s.category} • Owner: {s.ownerId || "-"}</div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: s.status === 'Needs Edits' ? '#a16207' : s.status === 'Dept Approved' ? '#166534' : s.status === 'Rejected' ? '#b91c1c' : '#6b7280' }}>{s.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </TabsContent>
            )}

            {/* Manager / GM */}
            {(hasRole("manager") || hasRole("gm")) && (
              <TabsContent value="manager-gm">
                <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 }}>
                  <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12 }}>{t("reporting.final_review")}</h2>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
                      {mgrData.items.map((r) => (
                        <li key={r.id} style={listItem}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{r.title}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>{t("reporting.dept")}: {r.department} • {t("reporting.category")}: {r.category}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={secondaryBtn} onClick={() => approve(r.id)}>{t("reporting.approve")}</button>
                            <button style={dangerBtn} onClick={() => requestEdits(r.id)}>{t("reporting.request_clarification")}</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <PaginationControls page={mgrPage} pageSize={5} total={mgrData.total} onPrev={() => setMgrPage(p => Math.max(1, p-1))} onNext={() => setMgrPage(p => p+1)} />
                  </div>

                  <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12 }}>{t("reporting.archive")}</h2>
                    <p style={{ color: "#555", marginBottom: 12 }}>{t("reporting.archive_hint")}</p>
                    <button style={ghostBtn} onClick={() => mgrData.items[0] && archive(mgrData.items[0].id)}>{t("reporting.archive_selected")}</button>
                  </div>
                </section>
              </TabsContent>
            )}

            {/* Admin */}
            {hasRole("admin") && (
              <TabsContent value="admin">
                <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginTop: 16 }}>
                  <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12 }}>{t("reporting.user_roles_access")}</h2>
                    <p style={{ color: "#555", marginBottom: 12 }}>{t("reporting.user_roles_access_hint")}</p>
                    <button style={ghostBtn}>{t("action.open") || "Open"}</button>
                  </div>

                  <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12 }}>{t("reporting.templates")}</h2>
                    <p style={{ color: "#555", marginBottom: 12 }}>{t("reporting.templates_hint")}</p>
                    <button style={ghostBtn}>{t("action.manage") || "Manage"}</button>
                  </div>

                  <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12 }}>{t("reporting.audit_logs")}</h2>
                    <p style={{ color: "#555", marginBottom: 12 }}>{t("reporting.audit_logs_hint")}</p>
                    <button style={ghostBtn}>{t("action.view") || "View"}</button>
                  </div>
                </section>

                {/* Moderator Dashboard for Abuse Reports */}
                <section style={{ marginTop: 24, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>Moderator Dashboard</h2>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Status</label>
                      <select value={modFilterStatus} onChange={(e) => setModFilterStatus(e.target.value)} style={inputStyle}>
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Type</label>
                      <select value={modFilterType} onChange={(e) => setModFilterType(e.target.value)} style={inputStyle}>
                        <option value="">All</option>
                        <option value="message">Message</option>
                        <option value="user">User</option>
                        <option value="group">Group</option>
                      </select>
                    </div>
                    <button style={primaryBtn} onClick={loadModReports}>Apply Filters</button>
                  </div>
                  {modReports.length === 0 ? (
                    <p style={{ color: '#666' }}>No reports found.</p>
                  ) : (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                      {modReports.map((r) => (
                        <li key={r.report_id} style={listItem}>
                          <div>
                            <div style={{ fontWeight: 600 }}>#{r.report_id.slice(0,8)} • {r.target_type} • {r.target_id}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>Reporter: {r.reporter_id} • Reason: {r.reason} • {new Date(r.created_at).toLocaleString()}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={secondaryBtn} onClick={async () => { await fetch(`/api/abuse-reports/${r.report_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'resolved' })}); loadModReports(); }}>Resolve</button>
                            <button style={ghostBtn} onClick={async () => { await fetch(`/api/abuse-reports/${r.report_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'dismissed' })}); loadModReports(); }}>Dismiss</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </TabsContent>
            )}
          </Tabs>

        </div>
      </div>
    </DashboardLayout>
  );
}

function PaginationControls({ page, pageSize, total, onPrev, onNext }: { page: number; pageSize: number; total: number; onPrev: () => void; onNext: () => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
      <span style={{ fontSize: 12, color: "#666" }}>Page {page} / {totalPages}</span>
      <button style={ghostBtn} onClick={onPrev} disabled={page <= 1}>Prev</button>
      <button style={ghostBtn} onClick={onNext} disabled={page >= totalPages}>Next</button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  outline: "none",
};

const primaryBtn: React.CSSProperties = {
  background: "#1565c0",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryBtn: React.CSSProperties = {
  background: "#43a047",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

const dangerBtn: React.CSSProperties = {
  background: "#dc3545",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

const ghostBtn: React.CSSProperties = {
  background: "transparent",
  color: "#1565c0",
  border: "1px solid #1565c0",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

const linkBtn: React.CSSProperties = {
  background: "transparent",
  color: "#1565c0",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontWeight: 600,
};

const listItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  border: "1px solid #eee",
  borderRadius: 8,
  padding: 12,
};

const errorText: React.CSSProperties = {
  fontSize: 12,
  color: "#dc3545",
  marginBottom: 6,
};
