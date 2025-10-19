"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // Helper to build an unsigned mock JWT for dev fallback
  const b64url = (input: string) => {
    const s = typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(input))) : ''
    return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  const setMockSession = (payload: any) => {
    const header = b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    const body = b64url(JSON.stringify(payload))
    const token = `${header}.${body}.mock`
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
      localStorage.setItem('accessToken', token)
      localStorage.setItem('jwt', token)
      document.cookie = `auth_token=${token}; Path=/; Max-Age=${60 * 60 * 8}; SameSite=Lax`
      document.cookie = `accessToken=${token}; Path=/; Max-Age=${60 * 60 * 8}; SameSite=Lax`
    }
    return token
  }

  const doLogin = async (emailArg: string, passwordArg: string) => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/auth/login", {
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
        if (process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true') {
          const isAdmin = emailArg.trim().toLowerCase() === 'admin@csc.gov' && passwordArg === 'Admin@123'
          const isUser = emailArg.trim().toLowerCase() === 'user@csc.gov' && passwordArg === 'User@123'
          if (isAdmin || isUser) {
            const roles = isAdmin ? ['ADMIN'] : ['EMPLOYEE']
            const name = isAdmin ? 'Mock Admin' : 'Mock User'
            setMockSession({
              sub: emailArg.trim().toLowerCase(),
              email: emailArg.trim().toLowerCase(),
              name,
              role: roles,
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
            })
            setMsg('Dev login fallback used. Redirecting...')
            router.push(isAdmin ? '/users' : '/dashboard')
            return
          }
        }
        throw new Error(String(errMsg));
      }

      const token = data?.access_token || data?.accessToken || data?.token || data?.jwt || data?.data?.token || data?.data?.access_token || data?.data?.jwt;
      if (typeof window !== "undefined" && token) {
        const val = String(token)
        localStorage.setItem("token", val)
        localStorage.setItem("accessToken", val)
        localStorage.setItem("jwt", val)
      }
      setMsg("Login successful. Redirecting...");
      router.push("/dashboard");
    } catch (err: any) {
      if (process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true') {
        const isAdmin = emailArg.trim().toLowerCase() === 'admin@csc.gov' && passwordArg === 'Admin@123'
        const isUser = emailArg.trim().toLowerCase() === 'user@csc.gov' && passwordArg === 'User@123'
        if (isAdmin || isUser) {
          const roles = isAdmin ? ['ADMIN'] : ['EMPLOYEE']
          const name = isAdmin ? 'Mock Admin' : 'Mock User'
          setMockSession({
            sub: emailArg.trim().toLowerCase(),
            email: emailArg.trim().toLowerCase(),
            name,
            role: roles,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
          })
          setMsg('Dev login fallback used. Redirecting...')
          router.push(isAdmin ? '/users' : '/dashboard')
          setLoading(false)
          return
        }
      }
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
        minHeight: "100vh",
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        background: "#0f172a",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1180,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          padding: 16,
        }}
      >
        <div
          style={{
            background:
              "radial-gradient(1200px 600px at 100% 0%, rgba(255,255,255,0.06), transparent 60%), linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0ea5e9 100%)",
            borderRadius: 14,
            color: "#fff",
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 128,
              height: 128,
              borderRadius: 24,
              background: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
              backdropFilter: "blur(2px)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.35)",
            }}>
              <Image
                src="/gallery/FCSC.jpg"
                alt="FCSC Logo"
                width={112}
                height={112}
                priority
                style={{ borderRadius: 16, objectFit: "cover", background: "#ffffff" }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>የፌደራል ሲቪል ሰርቪስ ኮሚሽን</div>
              <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2, marginBottom: 24 }}>Federal Civil Service Commission</div>
              <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.95, letterSpacing: 0.3 }}>INTEGRATED CSC DIGITAL SOLUTION</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <Link
              href="/about"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: "rgba(255,255,255,0.14)",
                color: "#fff",
                padding: "12px 18px",
                borderRadius: 12,
                textDecoration: "none",
                fontWeight: 800,
                boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
              }}
            >
              Learn More About Us
              <span>↗</span>
            </Link>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            padding: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: 420 }}>
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
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Welcome ICSCDS</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Sign in to your account</div>
            </div>

            {searchParams?.get("verify") === "1" && (
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

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                  <input type="checkbox" style={{ width: 16, height: 16 }} />
                  Remember Me
                </label>
                <Link href="/forgot-password" style={{ fontSize: 13, color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
                  Forgot Password?
                </Link>
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