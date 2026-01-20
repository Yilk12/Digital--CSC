"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserRoles } from "@/app/lib/auth";
import { getDepartmentInfo } from "@/app/lib/session";
import { Users, Truck, LifeBuoy, Clock, Send, Ticket, BookOpen, MapPin, Megaphone } from "lucide-react";
import { useLocalization } from "@/app/hooks/use-localization";

export default function VerticalNavigation() {
  const router = useRouter();
  const { t } = useLocalization();

  // Collapse states
  const [subOpen, setSubOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [wfOpen, setWfOpen] = React.useState(false);
  const [commOpen, setCommOpen] = React.useState(false);
  const [fleetOpen, setFleetOpen] = React.useState(false);

  // User role flags with loading state
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isPlanner, setIsPlanner] = React.useState(false);
  const [isDeptHead, setIsDeptHead] = React.useState(false);
  const [isTeamLead, setIsTeamLead] = React.useState(false);
  const [isEmployee, setIsEmployee] = React.useState(false);
  const [isHr, setIsHr] = React.useState(false);
  const [isFleetManag, setIsFleetManag] = React.useState(false);
  const [isMaintenanceTeam, setIsMaintenanceTeam] = React.useState(false);
  const [isCommissioner, setIsCommissioner] = React.useState(false);

  useEffect(() => {
    try {
      // Get roles from JWT and normalize to lowercase for consistent checks
      const roles = getCurrentUserRoles()?.map((r) => String(r).toLowerCase()) || [];

      setIsAdmin(roles.includes("admin"));
      // Planner is not a normalized role; approximate with leadership roles
      setIsPlanner(
        roles.includes("planner") || 
        roles.includes("manager") || 
        roles.includes("department_head") || 
        roles.includes("commissioner")
      );
      setIsDeptHead(roles.includes("department_head"));
      // Team lead is represented by leadership in normalized roles
      setIsTeamLead(roles.includes("team_lead") || roles.includes("manager"));
      setIsFleetManag(roles.includes("fleet_manager") || roles.includes("manager"));
      setIsMaintenanceTeam(roles.includes("maintenance_team"));
      // Treat driver and maintenance_team as employees for menu visibility
      setIsEmployee(
        roles.includes("employee") || 
        roles.includes("driver") || 
        roles.includes("maintenance_team")
      );
      setIsHr(roles.includes("hr"));
      setIsCommissioner(
        roles.includes("commissioner") ||
        roles.includes("commissionor")
      );
    } catch (error) {
      console.error("Error loading user roles:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => { console.log('is commissioner (state)', isCommissioner); }, [isCommissioner]);

  // Return null while loading to prevent flash of unauthorized content
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <nav
      style={{
        width: "100%",
        background: "transparent",
        minHeight: "100vh",
        boxSizing: "border-box",
        position: "relative",
        padding: 4,
      }}
    >
      <div style={{ display: "grid", gap: 12, marginTop: 0, padding: "8px 4px" }}>
        {/* Communication Broadcast Card */}
        <div style={{
          background: "white",
          borderRadius: 12,
          padding: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.08)",
          transition: "all 0.2s ease",
          overflow: "hidden"
        }}>
          <button
            onClick={() => setCommOpen(!commOpen)}
            aria-expanded={commOpen}
            aria-controls="comm-section"
            style={{
              width: "100%",
              background: "transparent",
              color: "var(--sb-text)",
              border: "none",
              padding: "16px",
              borderRadius: 12,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 12,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = "rgba(0,0,0,0.02)";
              const parent = target.parentElement;
              if (parent) {
                parent.style.transform = "translateY(-2px)";
                parent.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)";
              }
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = "transparent";
              const parent = target.parentElement;
              if (parent) {
                parent.style.transform = "translateY(0)";
                parent.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)";
              }
            }}
            onFocus={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.boxShadow = "0 0 0 2px var(--sb-ring)";
              const parent = target.parentElement;
              if (parent) {
                parent.style.boxShadow = "0 0 0 2px var(--sb-ring)";
              }
            }}
            onBlur={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.boxShadow = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)";
              }
            }}
            title="Communication Broadcast"
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(139, 92, 246, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Megaphone size={18} style={{ color: "#8B5CF6" }} />
            </div>
            <span style={{ flex: 1, fontSize: 15 }}>የመገናኛ ዘዴዎች</span>
            <span style={{
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6B7280"
            }}>
              {commOpen ? "▴" : "▾"}
            </span>
          </button>

          {commOpen && (
            <div id="comm-section" style={{ display: "grid", gap: 8, padding: "0 16px 16px 16px" }}>
              <button
                style={{
                  width: "100%",
                  background: "var(--sb-bg)",
                  color: "var(--sb-text)",
                  border: "1px solid var(--sb-border)",
                  padding: "8px 10px 8px 48px",
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textAlign: "left"
                }}
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "var(--sb-hover)")}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "var(--sb-bg)")}
                onFocus={(e) => ((e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px var(--sb-ring)")}
                onBlur={(e) => ((e.target as HTMLButtonElement).style.boxShadow = "none")}
                onClick={() => router.push("/voicebox")}
              >
                <span>🎙️ የጥቆማና ሀሳብ መስጫ</span>
              </button>
              <button
                style={{
                  width: "100%",
                  background: "var(--sb-bg)",
                  color: "var(--sb-text)",
                  border: "1px solid var(--sb-border)",
                  padding: "8px 10px 8px 48px",
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textAlign: "left"
                }}
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "var(--sb-hover)")}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "var(--sb-bg)")}
                onFocus={(e) => ((e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px var(--sb-ring)")}
                onBlur={(e) => ((e.target as HTMLButtonElement).style.boxShadow = "none")}
                onClick={() => router.push("/advertisement")}
              >
                <span>📢 ማስታወቂያ</span>
              </button>
            </div>
          )}
        </div>

        {/* Help Desk Card */}
        <div style={{
          background: "white",
          borderRadius: 12,
          padding: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.08)",
          transition: "all 0.2s ease",
          overflow: "hidden"
        }}>
          <button
            onClick={() => setHelpOpen((v) => !v)}
            aria-expanded={helpOpen}
            aria-controls="helpdesk-section"
            style={{
              width: "100%",
              background: "transparent",
              color: "var(--sb-text)",
              border: "none",
              padding: "16px",
              borderRadius: 12,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 12,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = "rgba(0,0,0,0.02)";
              const parent = target.parentElement;
              if (parent) {
                parent.style.transform = "translateY(-2px)";
                parent.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)";
              }
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = "transparent";
              const parent = target.parentElement;
              if (parent) {
                parent.style.transform = "translateY(0)";
                parent.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)";
              }
            }}
            onFocus={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.boxShadow = "0 0 0 2px var(--sb-ring)";
              const parent = target.parentElement;
              if (parent) {
                parent.style.boxShadow = "0 0 0 2px var(--sb-ring)";
              }
            }}
            onBlur={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.boxShadow = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)";
              }
            }}
            title={t("nav.helpdesk")}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <LifeBuoy size={18} style={{ color: "#4F46E5" }} />
            </div>
            <span style={{ flex: 1, fontSize: 15 }}>{t("nav.helpdesk")}</span>
            <span style={{
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6B7280"
            }}>
              {helpOpen ? "▴" : "▾"}
            </span>
          </button>

          {helpOpen && (
            <div id="helpdesk-section" style={{ display: "grid", gap: 8, padding: "0 16px 16px 16px" }}>
              {isCommissioner && (
                <button
                  style={{
                    width: "100%",
                    background: "white",
                    color: "var(--sb-text)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    padding: "10px 12px",
                    borderRadius: 8,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "var(--sb-hover)")}
                  onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "var(--sb-bg)")}
                  onFocus={(e) => ((e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px var(--sb-ring)")}
                  onBlur={(e) => ((e.target as HTMLButtonElement).style.boxShadow = "none")}
                  onClick={() => router.push('/commissioner/helpdesk')}
                >
                  <span>👁️ {t("nav.view_reports")}</span>
                </button>
              )}
              <button
                style={{
                  width: "100%",
                  background: "var(--sb-bg)",
                  color: "var(--sb-text)",
                  border: "1px solid var(--sb-border)",
                  padding: "8px 10px",
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "var(--sb-hover)")}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "var(--sb-bg)")}
                onFocus={(e) => ((e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px var(--sb-ring)")}
                onBlur={(e) => ((e.target as HTMLButtonElement).style.boxShadow = "none")}
                onClick={() => router.push("/tickets")}
              >
                <Ticket size={14} />
                <span>{t("nav.tickets")}</span>
              </button>
              <button
                style={{
                  width: "100%",
                  background: "var(--sb-bg)",
                  color: "var(--sb-text)",
                  border: "1px solid var(--sb-border)",
                  padding: "8px 10px",
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "var(--sb-hover)")}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "var(--sb-bg)")}
                onFocus={(e) => ((e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px var(--sb-ring)")}
                onBlur={(e) => ((e.target as HTMLButtonElement).style.boxShadow = "none")}
                onClick={() => router.push("/knowledge-base")}
              >
                <BookOpen size={14} />
                <span>{t("nav.knowledge_base")}</span>
              </button>
            </div>
          )}
        </div>

        

        {/* Voicebox removed */}

        {/* Admin Sections */}
        {isAdmin && (
          <>
            <button
              style={{
                width: "100%",
                background: "var(--sb-bg)",
                color: "var(--sb-text)",
                border: "1px solid var(--sb-border)",
                padding: "10px 12px",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "var(--sb-hover)")}
              onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "var(--sb-bg)")}
              onFocus={(e) => ((e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px var(--sb-ring)")}
              onBlur={(e) => ((e.target as HTMLButtonElement).style.boxShadow = "none")}
              onClick={() => router.push("/users")}
            >
              <Users size={16} />
              <span>{t("nav.users")}</span>
            </button>
          </>
        )}

        {/* Fleet Management Card */}
        <div style={{
          background: "white",
          borderRadius: 12,
          padding: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.08)",
          transition: "all 0.2s ease",
          overflow: "hidden"
        }}>
          <button
            onClick={() => setFleetOpen((v) => !v)}
            aria-expanded={fleetOpen}
            aria-controls="fleet-section"
            style={{
              width: "100%",
              background: "transparent",
              color: "var(--sb-text)",
              border: "none",
              padding: "16px",
              borderRadius: 12,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 12,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = "rgba(0,0,0,0.02)";
              const parent = target.parentElement;
              if (parent) {
                parent.style.transform = "translateY(-2px)";
                parent.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)";
              }
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = "transparent";
              const parent = target.parentElement;
              if (parent) {
                parent.style.transform = "translateY(0)";
                parent.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)";
              }
            }}
            onFocus={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.boxShadow = "0 0 0 2px var(--sb-ring)";
            }}
            onBlur={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.boxShadow = "none";
            }}
            title={t("nav.fleet_management")}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(16, 185, 129, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Truck size={18} style={{ color: "#10B981" }} />
            </div>
            <span style={{ flex: 1, fontSize: 15 }}>{t("nav.fleet_management")}</span>
            <span style={{
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6B7280"
            }}>
              {fleetOpen ? "▴" : "▾"}
            </span>
          </button>

          {fleetOpen && (
            <div id="fleet-section" style={{ display: "grid", gap: 8, padding: "0 16px 16px 16px" }}>
              <button
                style={{
                  width: "100%",
                  background: "var(--sb-bg)",
                  color: "var(--sb-text)",
                  border: "1px solid var(--sb-border)",
                  padding: "8px 10px 8px 48px",
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textAlign: "left"
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  (e.target as HTMLButtonElement).style.background = "var(--sb-hover)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  (e.target as HTMLButtonElement).style.background = "var(--sb-bg)";
                }}
                onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
                  (e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px var(--sb-ring)";
                }}
                onBlur={(e: React.FocusEvent<HTMLButtonElement>) => {
                  (e.target as HTMLButtonElement).style.boxShadow = "none";
                }}
                onClick={() => router.push("/fleet/request")}
              >
                <span>የተሽከርካሪ መጠየቂያ ቅፅ</span>
              </button>

              <button
                style={{
                  width: "100%",
                  background: "var(--sb-bg)",
                  color: "var(--sb-text)",
                  border: "1px solid var(--sb-border)",
                  padding: "8px 10px 8px 48px",
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textAlign: "left"
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  (e.target as HTMLButtonElement).style.background = "var(--sb-hover)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  (e.target as HTMLButtonElement).style.background = "var(--sb-bg)";
                }}
                onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
                  (e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px var(--sb-ring)";
                }}
                onBlur={(e: React.FocusEvent<HTMLButtonElement>) => {
                  (e.target as HTMLButtonElement).style.boxShadow = "none";
                }}
                onClick={() => router.push("/fleet/request?tab=fuel")}
              >
                <span>የነዳጅ እና የመኪና ጥገና መጠየቂያ</span>
              </button>

              {isMaintenanceTeam && (
                <button
                  style={{
                    width: "100%",
                    background: "var(--sb-bg)",
                    color: "var(--sb-text)",
                    border: "1px solid var(--sb-border)",
                    padding: "8px 10px 8px 48px",
                    borderRadius: 6,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textAlign: "left",
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    (e.target as HTMLButtonElement).style.background = "var(--sb-hover)";
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    (e.target as HTMLButtonElement).style.background = "var(--sb-bg)";
                  }}
                  onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
                    (e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px var(--sb-ring)";
                  }}
                  onBlur={(e: React.FocusEvent<HTMLButtonElement>) => {
                    (e.target as HTMLButtonElement).style.boxShadow = "none";
                  }}
                  onClick={() => router.push("/fleet/maintenance")}
                >
                  <span>Maintenance Team Dashboard</span>
                </button>
              )}

              {(isFleetManag || isAdmin || isHr || isCommissioner) && (
                <button
                  style={{
                    width: "100%",
                    background: "var(--sb-bg)",
                    color: "var(--sb-text)",
                    border: "1px solid var(--sb-border)",
                    padding: "8px 10px 8px 48px",
                    borderRadius: 6,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textAlign: "left"
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    (e.target as HTMLButtonElement).style.background = "var(--sb-hover)";
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    (e.target as HTMLButtonElement).style.background = "var(--sb-bg)";
                  }}
                  onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
                    (e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px var(--sb-ring)";
                  }}
                  onBlur={(e: React.FocusEvent<HTMLButtonElement>) => {
                    (e.target as HTMLButtonElement).style.boxShadow = "none";
                  }}
                  onClick={() => router.push(isCommissioner ? "/commissioner/fleet" : "/fleet/manager")}
                >
                  <span>Fleet Manager Dashboard</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
