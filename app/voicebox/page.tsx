"use client"

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeJwt } from "@/app/lib/auth";

interface Item {
  id: string;
  feedbackType: string;
  subject: string;
  status: string;
  createdAt: string;
  fullName?: string;
  department?: string;
  priority?: string;
}

export default function VoiceboxDashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roles = useMemo(() => {
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null;
      if (!token) return [] as string[];
      const p: any = decodeJwt(token);
      const rr: string[] = [];
      if (typeof p?.role === 'string') rr.push(p.role);
      if (Array.isArray(p?.role)) rr.push(...p.role);
      if (Array.isArray(p?.roles)) rr.push(...p.roles);
      if (p?.realm_access?.roles) rr.push(...p.realm_access.roles);
      if (p?.resource_access) { for (const v of Object.values(p.resource_access)) { const rrs = (v as any)?.roles; if (Array.isArray(rrs)) rr.push(...rrs) } }
      return rr.map(String).map(r=>r.toUpperCase());
    } catch { return [] as string[]; }
  }, []);

  const isAdminOrDirector = roles.some(r => /(ADMIN|GENERAL_DIRECTOR|DIRECTOR|SUPERUSER)/.test(r));
  const isDeptHead = roles.some(r => /(DEPARTMENT_HEAD|DEPT_HEAD)/.test(r));

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null;
      const headers: Record<string,string> = {};
      if (token) headers['authorization'] = `Bearer ${token}`;
      const r = await fetch('/api/voicebox', { headers });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed');
      setItems(Array.isArray(d?.items) ? d.items : []);
    } catch (e:any) {
      setError(e?.message || 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Voicebox</h1>
          <div className="text-sm text-gray-600">Complaints, Suggestions, and Compliments</div>
        </div>
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>router.push('/voicebox/submit')}>New Submission</button>
      </div>

      {error && <div className="text-sm text-red-700">{error}</div>}

      <div className="overflow-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border">Type</th>
              <th className="text-left p-2 border">Subject</th>
              <th className="text-left p-2 border">Status</th>
              <th className="text-left p-2 border">Priority</th>
              <th className="text-left p-2 border">Submitter</th>
              <th className="text-left p-2 border">Department</th>
              <th className="text-left p-2 border">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-2 border" colSpan={7}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="p-2 border" colSpan={7}>No items</td></tr>
            ) : items.map(it => (
              <tr key={it.id}>
                <td className="p-2 border capitalize">{it.feedbackType}</td>
                <td className="p-2 border">{it.subject}</td>
                <td className="p-2 border uppercase text-xs">{it.status}</td>
                <td className="p-2 border">{it.priority || 'normal'}</td>
                <td className="p-2 border">{it.fullName || 'Anonymous'}</td>
                <td className="p-2 border">{it.department || '-'}</td>
                <td className="p-2 border">{new Date(it.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(isAdminOrDirector || isDeptHead) && (
        <div className="text-xs text-gray-600">Admins/Directors see all submissions; Department Heads see their department; Employees see their own.</div>
      )}
    </div>
  );
}
