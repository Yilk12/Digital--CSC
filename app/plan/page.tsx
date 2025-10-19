"use client"

import React from "react"
import { decodeJwt } from "@/app/lib/auth"

const defaultData = {
  planningRequirements: {
    strategicAlignment: {
      description: "Aligns plan with organizational goals and measurable indicators.",
      requirements: [
        "Define organizational goals.",
        "Align departmental objectives and KPIs with strategy.",
        "Identify and track Key Success Indicators (KSIs).",
      ],
    },
    stakeholders: {
      description: "Involves key internal and external parties.",
      requirements: [
        "Document stakeholder list.",
        "Define roles and responsibilities (use RACI matrix).",
        "Establish communication plan (who, when, how).",
      ],
    },
    scope: {
      description: "Defines the boundaries and constraints of the plan.",
      requirements: [
        "Clearly define what is in and out of scope.",
        "Set planning and execution timelines.",
        "Document constraints (budget, time, regulations).",
      ],
    },
    resources: {
      description: "Identifies the resources required for plan execution.",
      requirements: [
        "Specify required human resources (skills, availability).",
        "List tools, technologies, and infrastructure.",
        "Calculate and approve budget estimates.",
      ],
    },
    riskAndMitigation: {
      description: "Manages risks and defines contingency strategies.",
      requirements: [
        "Identify potential risks (delays, resource gaps, etc.).",
        "Define mitigation and contingency plans.",
        "Establish decision-making and escalation protocols.",
      ],
    },
    monitoringAndReporting: {
      description: "Ensures progress tracking and feedback mechanisms.",
      requirements: [
        "Select progress tracking tools (dashboards, KPIs, reports).",
        "Define a review schedule (e.g., weekly, monthly).",
        "Establish feedback loops (surveys, retrospectives).",
      ],
    },
  },
  systemDesignRequirements: {
    functional: {
      description: "Defines core system features and actions.",
      requirements: [
        "User authentication and access control.",
        "CRUD operations.",
        "Workflow automation and task sequencing.",
        "Real-time notifications and alerts.",
        "Analytics and reporting features.",
        "Integration with external systems (e.g., HRIS, ERP, CRM).",
      ],
    },
    nonFunctional: {
      description: "Specifies how the system performs and behaves.",
      categories: {
        performance: "Fast response times, scalable architecture.",
        reliability: "99.9% uptime, disaster recovery support.",
        security: "Data encryption, role-based access.",
        usability: "Intuitive UI/UX, accessibility (WCAG).",
        maintainability: "Modular code, clear documentation.",
        portability: "Cross-platform/device compatibility.",
      },
    },
    user: {
      description: "Focuses on user needs and interaction design.",
      requirements: [
        "Define user personas and their needs.",
        "Document use cases and user journeys.",
        "Include accessibility and language support.",
        "Specify UI and UX requirements.",
      ],
    },
    data: {
      description: "Manages data flow, security, and compliance.",
      requirements: [
        "Define data inputs, outputs, and storage needs.",
        "Ensure compliance (e.g., GDPR, HIPAA).",
        "Plan for data backup and recovery.",
        "Outline database structure and models.",
      ],
    },
    technical: {
      description: "Defines the technical stack and architecture.",
      requirements: [
        "Specify software and hardware requirements.",
        "Choose development platforms (e.g., React, .NET, Java).",
        "Select hosting environment (cloud, on-premise, hybrid).",
        "Define API protocols and integration standards.",
      ],
    },
  },
  planningDesignChecklist: [
    { item: "Goals Defined", description: "Measurable, strategic, and aligned objectives." },
    { item: "Stakeholders Identified", description: "Clear roles and communication plans." },
    { item: "Metrics Established", description: "KPIs, success indicators, review cycles." },
    { item: "Budget & Resources", description: "Approvals, availability, and cost tracking." },
    { item: "Risks & Security", description: "Risk management, data protection, escalation paths." },
    { item: "System Features", description: "Prioritized, functional, and technically feasible." },
    { item: "Compliance Ensured", description: "Legal and regulatory requirements covered." },
    { item: "Testing Plan", description: "QA strategy, test cases, user acceptance testing." },
  ],
}

export default function PlanPage() {
  const [isPrivileged, setIsPrivileged] = React.useState(false)
  const [data, setData] = React.useState<typeof defaultData>(defaultData)
  const [edit, setEdit] = React.useState(true)
  type PlanningKey = keyof typeof defaultData.planningRequirements

  function getAllowedRoles(): string[] {
    const env = process.env.NEXT_PUBLIC_PLAN_ALLOWED_ROLES
    if (env) return env.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)
    return ['admin','manager','staff_manager','system_admin','support_agent']
  }

  async function ensureXlsx(): Promise<any | null> {
    if (typeof window === 'undefined') return null
    // If already loaded on window, use it
    if ((window as any).XLSX) return (window as any).XLSX
    // Load from CDN
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js'
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load XLSX from CDN'))
      document.body.appendChild(s)
    })
    return (window as any).XLSX || null
  }

  async function onExportXlsx() {
    try {
      const XLSX: any = await ensureXlsx()
      if (!XLSX) throw new Error('XLSX library not available')
      const wb = XLSX.utils.book_new()
      // Planning Requirements sheet
      const prRows: any[] = [["Section","Item","Value"]]
      for (const [k,v] of Object.entries(data.planningRequirements)) {
        prRows.push([splitCamel(k), "Description", v.description])
        v.requirements.forEach((r, i) => prRows.push([splitCamel(k), `Req #${i+1}`, r]))
      }
      const wsPR = XLSX.utils.aoa_to_sheet(prRows)
      XLSX.utils.book_append_sheet(wb, wsPR, 'Planning')

      // System Design sheets
      const sdr = data.systemDesignRequirements
      const fnRows = [["Functional Requirements"] as any[]].concat(sdr.functional.requirements.map(r=>[r]))
      const wsFN = XLSX.utils.aoa_to_sheet(fnRows)
      XLSX.utils.book_append_sheet(wb, wsFN, 'Functional')

      const nfRows: any[] = [["Category","Detail"]]
      for (const [k,v] of Object.entries(sdr.nonFunctional.categories)) nfRows.push([k, String(v)])
      const wsNF = XLSX.utils.aoa_to_sheet(nfRows)
      XLSX.utils.book_append_sheet(wb, wsNF, 'NonFunctional')

      const userRows = [["User Requirements"] as any[]].concat(sdr.user.requirements.map(r=>[r]))
      const wsUser = XLSX.utils.aoa_to_sheet(userRows)
      XLSX.utils.book_append_sheet(wb, wsUser, 'User')

      const dataRows = [["Data Requirements"] as any[]].concat(sdr.data.requirements.map(r=>[r]))
      const wsData = XLSX.utils.aoa_to_sheet(dataRows)
      XLSX.utils.book_append_sheet(wb, wsData, 'Data')

      const techRows = [["Technical Requirements"] as any[]].concat(sdr.technical.requirements.map(r=>[r]))
      const wsTech = XLSX.utils.aoa_to_sheet(techRows)
      XLSX.utils.book_append_sheet(wb, wsTech, 'Technical')

      const checklistRows = [["Item","Description"] as any[]].concat(data.planningDesignChecklist.map(c=>[c.item, c.description]))
      const wsCL = XLSX.utils.aoa_to_sheet(checklistRows)
      XLSX.utils.book_append_sheet(wb, wsCL, 'Checklist')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob); triggerDownload(url, 'plan.xlsx')
    } catch (e) {
      alert('Failed to export .xlsx. The Excel library could not be loaded. Please check your network or install "xlsx" locally.')
    }
  }

  // Removed editors for deleted sections

  React.useEffect(() => {
    // role gate
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null
      if (token) {
        const payload: any = decodeJwt(token)
        const roles: string[] = []
        if (typeof payload?.role === 'string') roles.push(payload.role)
        if (Array.isArray(payload?.role)) roles.push(...payload.role)
        if (Array.isArray(payload?.roles)) roles.push(...payload.roles)
        if (payload?.realm_access?.roles) roles.push(...payload.realm_access.roles)
        if (payload?.resource_access) {
          for (const v of Object.values(payload.resource_access)) {
            const rr = (v as any)?.roles
            if (Array.isArray(rr)) roles.push(...rr)
          }
        }
        const lower = roles.map(String).map(r=>r.toLowerCase())
        const allowed = getAllowedRoles()
        const ok = lower.some(r => allowed.some(a => r.includes(a)))
        setIsPrivileged(ok)
      }
    } catch {}

    // load from API
    ;(async () => {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null
        const res = await fetch('/api/plan', { headers: token ? { Authorization: `Bearer ${token}` } : undefined, cache: 'no-store' })
        if (res.ok) {
          const j = await res.json()
          if (j && Object.keys(j).length > 0) setData(j)
        }
      } catch {}
    })()
  }, [])

  React.useEffect(() => {
    if (!isPrivileged) setEdit(false)
  }, [isPrivileged])

  function onSave() {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null
        const res = await fetch('/api/plan', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(data) })
        if (!res.ok) throw new Error('Save failed')
        alert('Saved.')
      } catch (e) { alert('Failed to save'); }
    })()
  }
  function onExportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); triggerDownload(url, 'plan.json')
  }
  function onExportCSV() {
    const rows: string[] = []
    rows.push('Section,Key,Value')
    for (const [k,v] of Object.entries(data.planningRequirements)) {
      rows.push(`Planning Requirements,${escapeCsv(splitCamel(k))},${escapeCsv(v.description)}`)
      v.requirements.forEach((r,i)=>rows.push(`Planning Requirements,${escapeCsv(splitCamel(k))} #${i+1},${escapeCsv(r)}`))
    }
    const sdr = data.systemDesignRequirements
    sdr.functional.requirements.forEach((r,i)=>rows.push(`System Design,Functional #${i+1},${escapeCsv(r)}`))
    for (const [k,v] of Object.entries(sdr.nonFunctional.categories)) rows.push(`System Design,Non-Functional ${escapeCsv(k)},${escapeCsv(v as string)}`)
    sdr.user.requirements.forEach((r,i)=>rows.push(`System Design,User #${i+1},${escapeCsv(r)}`))
    sdr.data.requirements.forEach((r,i)=>rows.push(`System Design,Data #${i+1},${escapeCsv(r)}`))
    sdr.technical.requirements.forEach((r,i)=>rows.push(`System Design,Technical #${i+1},${escapeCsv(r)}`))
    data.planningDesignChecklist.forEach((c)=>rows.push(`Checklist,${escapeCsv(c.item)},${escapeCsv(c.description)}`))
    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); triggerDownload(url, 'plan.csv')
  }
  function onPrint() { if (typeof window !== 'undefined') window.print() }

  function onExportWord() {
    // Simple HTML doc with brand header
    const brand = `<div style="text-align:center;font-family:Arial;color:#135a98;margin-bottom:12px"><div style="font-weight:800;font-size:20px">የፌደራል ሲቪል ሰርቪስ ኮሚሽን</div><img src="/gallery/ecsc.jpg" style="width:60px;height:60px;border-radius:8px;object-fit:cover;margin:4px"/><div style="font-weight:800;font-size:18px">Civil Service Commission</div></div>`
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Plan</title></head><body>${brand}<pre style="white-space:pre-wrap;font-family:Arial">${escapeHtml(JSON.stringify(data, null, 2))}</pre></body></html>`
    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob); triggerDownload(url, 'plan.doc')
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header removed by request */}
    </div>
  )
}

function splitCamel(s: string) {
  if (!s) return ''
  return String(s)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w|\s\w/g, (c) => c.toUpperCase())
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function escapeCsv(v: string) {
  if (v == null) return ''
  const s = String(v)
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

function escapeHtml(v: string) {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Removed demo users - assignments section deleted
