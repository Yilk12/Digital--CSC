"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { decodeJwt } from "@/app/lib/auth";

export default function VerticalNavigation() {
  const router = useRouter();
  const [subOpen, setSubOpen] = React.useState(false);
  const [planOpen, setPlanOpen] = React.useState(false);
  const [voiceOpen, setVoiceOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [wfOpen, setWfOpen] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isPlanner, setIsPlanner] = React.useState(false);
  const [isDeptHead, setIsDeptHead] = React.useState(false);
  const [isTeamLead, setIsTeamLead] = React.useState(false);
  const [isEmployee, setIsEmployee] = React.useState(false);

  React.useEffect(() => {
    try {
      const token = typeof window !== "undefined" ? (localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token")) : null;
      if (token) {
        const payload: any = decodeJwt(token);
        const roles: string[] = [];
        const p: any = payload || {};
        if (typeof p.role === 'string') roles.push(p.role);
        if (Array.isArray(p.role)) roles.push(...p.role);
        if (Array.isArray(p.roles)) roles.push(...p.roles);
        if (p.realm_access?.roles) roles.push(...p.realm_access.roles);
        if (p.resource_access) {
          for (const v of Object.values(p.resource_access)) {
            const rr = (v as any)?.roles;
            if (Array.isArray(rr)) roles.push(...rr);
          }
        }
        const lower = roles.map(String).map(r => r.toUpperCase());
        const isAdm = lower.some(r => /(ADMIN|SYSTEM[_-]?ADMIN|SUPERUSER)/.test(r));
        setIsAdmin(isAdm);
        setIsPlanner(lower.includes('PLANNING') || lower.includes('PLANNER') || lower.includes('STRATEGY'));
        setIsDeptHead(lower.includes('DEPARTMENT_HEAD') || lower.includes('DEPT_HEAD'));
        setIsTeamLead(lower.includes('TEAM_LEAD') || lower.includes('SUPERVISOR'));
        setIsEmployee(lower.includes('EMPLOYEE') || lower.includes('STAFF'));
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <nav
      style={{
        width: "100%",
        background: "#135a98",
        minHeight: "100vh",
        boxSizing: "border-box",
        position: "relative",
        padding: 4,
      }}
    >
      {/* Core Navigation (flattened) */}
      <div style={{ display: "grid", gap: 8, marginTop: 0 }}>
        {/* Help Desk Section */}
        <div style={{ background: '#0f4a78', borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => setHelpOpen(v => !v)}
            aria-expanded={helpOpen}
            aria-controls="helpdesk-section"
            style={{ width: '100%', background: 'transparent', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 6, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
            title="Help Desk"
          >
            Help Desk {helpOpen ? '▴' : '▾'}
          </button>
          {helpOpen && (
            <div id="helpdesk-section" style={{ display: 'grid', gap: 6, padding: 4 }}>
              <button
                style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#1d4ed8' }}
                onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#2563eb' }}
                onClick={() => router.push('/tickets')}
              >
                Tickets
              </button>
              <button
                style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#1d4ed8' }}
                onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#2563eb' }}
                onClick={() => router.push('/knowledge-base')}
              >
                Knowledge Base
              </button>
            </div>
          )}
        </div>


        {/* Field & Overtime Section */}
        <div style={{ background: '#0f4a78', borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => setWfOpen(v => !v)}
            aria-expanded={wfOpen}
            aria-controls="wf-section"
            style={{ width: '100%', background: 'transparent', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 6, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
            title="Field & Overtime"
          >
            Field & Overtime {wfOpen ? '▴' : '▾'}
          </button>
          {wfOpen && (
            <div id="wf-section" style={{ display: 'grid', gap: 6, padding: 4 }}>
              {(isEmployee || isTeamLead || isDeptHead || isAdmin) && (
                <>
                  <button
                    style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#1d4ed8' }}
                    onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#2563eb' }}
                    onClick={() => router.push('/workflow/field-overtime')}
                  >
                    Field
                  </button>
                  <button
                    style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#1d4ed8' }}
                    onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#2563eb' }}
                    onClick={() => router.push('/workflow/field-overtime')}
                  >
                    Overtime
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Voicebox Section */}
        <div style={{ background: '#0f4a78', borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => setVoiceOpen(v => !v)}
            aria-expanded={voiceOpen}
            aria-controls="voicebox-section"
            style={{ width: '100%', background: 'transparent', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 6, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
            title="Voicebox"
          >
            Voicebox {voiceOpen ? '▴' : '▾'}
          </button>
          {voiceOpen && (
            <div id="voicebox-section" style={{ display: 'grid', gap: 6, padding: 4 }}>
              <button
                style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#1d4ed8' }}
                onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#2563eb' }}
                onClick={() => router.push('/voicebox/submit')}
              >
                New Submission
              </button>
            </div>
          )}
        </div>

        {isAdmin && (
          <button
            style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", padding: "10px 12px", borderRadius: 8, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "#1d4ed8"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "#2563eb"; }}
            onClick={() => router.push("/users")}
          >
            User Management
          </button>
        )}

        {isAdmin && (
          <button
            style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", padding: "10px 12px", borderRadius: 8, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "#1d4ed8"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "#2563eb"; }}
            onClick={() => router.push("/admin/settings")}
          >
            Settings
          </button>
        )}

        <button
          style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", padding: "10px 12px", borderRadius: 8, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
          onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "#1d4ed8"; }}
          onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "#2563eb"; }}
          onClick={() => router.push("/fleet")}
        >
          Fleet Management
        </button>

        {/* Plan & Report Section */}
        <div style={{ background: '#0f4a78', borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => setPlanOpen(v => !v)}
            aria-expanded={planOpen}
            aria-controls="plan-report-section"
            style={{ width: '100%', background: 'transparent', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 6, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
            title="Plan and Report"
          >
            Plan & Report {planOpen ? '▴' : '▾'}
          </button>
          {planOpen && (
            <div id="plan-report-section" style={{ display: 'grid', gap: 6, padding: 4 }}>
              <button
                style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#1d4ed8' }}
                onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#2563eb' }}
                onClick={() => router.push('/workflow/my-tasks')}
              >
                My Tasks
              </button>
            </div>
          )}
        </div>


      </div>
    </nav>
  );
}

 
