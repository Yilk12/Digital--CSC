"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { decodeJwt, getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { saveAuthSession, getDepartmentInfo } from "@/app/lib/session";

function LoginPageInner() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [showVerifyMessage, setShowVerifyMessage] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      setShowVerifyMessage(params.get("verify") === "1");
    } catch {}
  }, []);

  const doLogin = async (emailArg: string, passwordArg: string) => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: emailArg, password: passwordArg }),
      });

      const raw = await res.text();
      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = { message: raw || undefined }; }

      if (!res.ok) {
        const errMsg = data?.message || data?.error || data?.detail || raw || "Invalid credentials";
        throw new Error(String(errMsg));
      }

      const token = data?.access_token || data?.accessToken || data?.token || data?.jwt || data?.data?.token || data?.data?.access_token || data?.data?.jwt;
      if (typeof window !== "undefined" && token) {
        const val = String(token)
        localStorage.setItem("token", val)
        localStorage.setItem("accessToken", val)
        localStorage.setItem("jwt", val)
        // Persist session (token + backend user and decoded payload)
        try {
          saveAuthSession(val, data?.user ?? null)
        } catch {}
        // Safe client-side logging of user data
        try {
         
          const decoded = decodeJwt(val)
  
        } catch {}
      }
      setMsg("Login successful. Redirecting...");
      // Determine role-based dashboard
      const primary = getCurrentUserPrimaryRole();
      const { name: deptName } = getDepartmentInfo();

      let target = "/dashboard/end-user";
      if (primary === "admin") {
        target = "/dashboard/admin";
      } else if (primary === "commissioner") {
        target = "/dashboard/Commissioner/Ethics_Anti_Corruption";
      } else if (primary === "ethics_anti_corruption") {
        target = "/dashboard/Ethics_Anti_Corruption";
      } else if (primary === "women_social_inclusion") {
        target = "/dashboard/department-head/women-social-inclusion";
      } else if (primary === "department_head") {
        if (deptName === "Executive Director, Women and Social Inclusion Program") {
          target = "/dashboard/department-head/women-social-inclusion";
        } else {
          target = "/dashboard/department-head";
        }
      } else if (primary === "") {
        // No dedicated HR supervisor area anymore; fall back to department-head dashboard
        target = "/dashboard/department-head";
      } else if (primary === "driver") {
        target = "/fleet/driver";
      } else if (primary === "maintenance_team") {
        target = "/maintenance-team/";
      }

      // Default falls back to end-user dashboard
      router.push(target);
    } catch (err: any) {
      const safeMsg = (err && typeof err.message === 'string' && err.message) || 'Login failed'
      setMsg(safeMsg)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password)
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        background: "#ffffff", // ensure no off-white gutter is visible
      }}
    >
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
        }}
      >
        <div
          style={{
            background: "#00579b",
            color: "#fff",
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
            height: "100%",
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 400,
              height: 220,
              borderRadius: 12,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
              boxShadow: "0 6px 18px rgba(15,23,42,0.35)",
              border: "1px solid rgba(148,163,184,0.7)",
              overflow: "hidden",
            }}>
              <Image
                src="/gallery/FCSC.jpg"
                alt="FCSC Logo"
                width={220}
                height={220}
                priority
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: 8,
                  background: "#ffffff",
                }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.95, letterSpacing: 0.3, color: 'normal' }}>የተቀናጀ የሲቪል ሰርቪስ ኮሚሽን ዲጂታል ሶሊዩሽን</div>
              <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.95, letterSpacing: 0.3, color: 'pink' }}>ቀላል ፣ ቀልጣፋና ደህንነቱ የተጠበቀ</div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            boxShadow: "none",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <div style={{ width: "100%", maxWidth: 440, marginRight: 0 }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                margin: "0 auto 12px",
                background: "linear-gradient(135deg,#4f46e5,#0ea5e9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 10px 30px rgba(79,70,229,0.35)",
              }}>
                <span style={{ fontSize: 28 }}>🔒</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>እንኳን ደህና መጡ</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>በመጠቀሚያ አካዉንትዎ ይግቡ</div>
            </div>

            {showVerifyMessage && (
              <div style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#ecfdf5",
                color: "#065f46",
                border: "1px solid #a7f3d0",
                fontSize: 13,
              }}>
                Your account was created. Please check your email to verify your address, then sign in.
              </div>
            )}

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
              <div>
                <label htmlFor="email" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 6 }}>Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f8fafc" }}
                  placeholder="Example@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 6 }}>Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f8fafc" }}
                  placeholder="Enter your password"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", marginTop: 2 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                  <input type="checkbox" style={{ width: 16, height: 16 }} />
                  Remember Me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: loading ? "#a3a3a3" : "#2563eb",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 10px 25px rgba(37,99,235,0.35)",
                }}
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            

            {msg && (
              <p style={{ marginTop: 12, fontSize: 13, textAlign: "center", color: msg.includes("successful") ? "#16a34a" : "#b91c1c" }}>{msg}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginPageInner />;
}