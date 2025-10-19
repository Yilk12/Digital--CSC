// In-memory platform-wide store for multiple modules
export type ModuleKey =
  | 'tickets'
  | 'knowledge_base'
  | 'complaints'
  | 'users'
  | 'fleet'
  | 'reports'
  | 'feedback'
  | 'analytics'
  | 'planning'
  | 'messages'

export type ItemRecord = { id: string; [key: string]: any }

 

// Workflow stores
export type Assignment = {
  id: string;
  planId: string;
  level: 'DEPARTMENT'|'TEAM'|'EMPLOYEE';
  fromUserId: string;
  toUserId?: string;
  departmentId?: string;
  teamId?: string;
  dueDate?: string;
  notes?: string;
  status: 'PENDING'|'IN_PROGRESS'|'COMPLETED'|'REJECTED';
  createdAt: string;
  history: Array<{ by: string; action: string; at: string; comments?: string }>;
}

export type Report = {
  id: string;
  planId: string;
  assignmentId: string;
  submittedBy: string;
  submittedTo: string;
  body: string;
  attachments: Array<{ url: string; name: string; type: string; size?: number }>;
  status: 'SUBMITTED'|'REVIEWED'|'APPROVED'|'REJECTED';
  createdAt: string;
  history: Array<{ by: string; action: string; at: string; comments?: string }>;
  // Workflow routing for reports: EMPLOYEE -> TEAM -> DEPARTMENT -> PLANNING
  route?: {
    chain: Array<'EMPLOYEE'|'TEAM'|'DEPARTMENT'|'PLANNING'>;
    current: 'EMPLOYEE'|'TEAM'|'DEPARTMENT'|'PLANNING';
  };
  approvals?: Array<{ stage: 'EMPLOYEE'|'TEAM'|'DEPARTMENT'|'PLANNING'; by?: string; at?: string; decision?: 'REVIEW'|'APPROVE'|'REJECT'; comments?: string }>;
  // Extended fields for planning reports
  periodStart?: string; // Week/period start ISO date
  periodEnd?: string;   // Week/period end ISO date
  employeeName?: string;
  teamName?: string;
  frequency?: 'Daily'|'Weekly'|'Monthly'|'Quarterly'|'Semi-Annual'|'Yearly'|'Other';
  quarter?: 'Q1'|'Q2'|'Q3'|'Q4';
  summary?: {
    keyTasks?: string;
    progressVsGoals?: string;
    ongoing?: string;
    challenges?: string;
    collaboration?: string;
    metrics?: string; // e.g., % goals achieved, sales, tickets closed
    learnings?: string;
    nextWeek?: string;
    managerComments?: string;
  };
}

export const WORKFLOW_ASSIGNMENTS: Assignment[] = [
  {
    id: 'ASN-001',
    planId: 'PLN-001',
    level: 'EMPLOYEE',
    fromUserId: 'U-004',
    toUserId: 'U-002',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    notes: 'Review and update operational procedures for Q4',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    history: [{ by: 'U-004', action: 'create', at: new Date().toISOString(), comments: 'Review and update operational procedures for Q4' }]
  },
  {
    id: 'ASN-002',
    planId: 'PLN-001',
    level: 'EMPLOYEE',
    fromUserId: 'U-004',
    toUserId: 'U-005',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    notes: 'Prepare strategic analysis report for Q4 planning',
    status: 'IN_PROGRESS',
    createdAt: new Date().toISOString(),
    history: [
      { by: 'U-004', action: 'create', at: new Date().toISOString(), comments: 'Prepare strategic analysis report for Q4 planning' },
      { by: 'U-005', action: 'start', at: new Date().toISOString() }
    ]
  },
  {
    id: 'ASN-003',
    planId: 'PLN-001',
    level: 'EMPLOYEE',
    fromUserId: 'U-004',
    toUserId: 'U-006',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    notes: 'Complete financial budget review for Q4',
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    history: [
      { by: 'U-004', action: 'create', at: new Date().toISOString(), comments: 'Complete financial budget review for Q4' },
      { by: 'U-006', action: 'start', at: new Date().toISOString() },
      { by: 'U-006', action: 'complete', at: new Date().toISOString() }
    ]
  }
];
export const WORKFLOW_REPORTS: Report[] = [];

// Daily Task Records
export type DailyTask = {
  title: string;
  description?: string;
  startTime?: string; // HH:MM
  endTime?: string;   // HH:MM
  totalMinutes?: number; // auto or manual
  priority?: 'High'|'Medium'|'Low';
  status?: 'Completed'|'In Progress'|'Blocked';
  remarks?: string;
}

export type DailyTaskRecord = {
  id: string;
  date: string; // yyyy-mm-dd
  employeeName: string;
  department?: string;
  team?: string;
  supervisorName?: string;
  tasks: DailyTask[];
  totalMinutes?: number;
  challenges?: string;
  suggestions?: string;
  submittedTo?: string; // manager/supervisor id or email
  signature?: string;   // optional text signature
  submittedBy: string;  // user id/email
  createdAt: string;
}

export const DAILY_TASK_RECORDS: DailyTaskRecord[] = [];

// General Reports (aggregated across periods)
export type GeneralReport = {
  id: string;
  periodType: 'Daily'|'Weekly'|'Monthly'|'Custom'|'All';
  periodStart?: string; // yyyy-mm-dd
  periodEnd?: string;   // yyyy-mm-dd
  submittedBy: string;
  submittedTo?: string;
  title?: string;
  notes?: string;
  stats: {
    totalMinutes: number;
    totalTasks: number;
    completed: number;
    inProgress: number;
    blocked: number;
  };
  createdAt: string;
};

export const GENERAL_REPORTS: GeneralReport[] = [];

// =============================
// Fleet Maintenance (in-memory)
// =============================
export type IncidentSeverity = 'HIGH' | 'LOW'
export type ReceiptPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'

export type MaintenanceReceipt = {
  id: string
  organization: string // vendor/garage name
  number?: string      // receipt/invoice number
  date?: string        // ISO date
  amount: number
  currency?: string
  fileName?: string
  fileUrl?: string // optional if uploaded somewhere
}

export type MaintenanceRecord = {
  id: string
  driverId: string
  vehicleId?: string
  incidentId?: string
  incidentDate?: string
  incidentSeverity: IncidentSeverity
  description?: string
  receipts: MaintenanceReceipt[]
  receiptPeriod: ReceiptPeriod
  createdAt: string
}

export type MaintenanceRequest = {
  id: string
  managerId: string
  driverId: string
  vehicleId?: string
  sourceRecordId?: string // optional reference to a driver record
  status: 'OPEN' | 'SENT_TO_FINANCE' | 'PAID'
  incidentSeverity: IncidentSeverity
  organization: string
  receipts: MaintenanceReceipt[]
  receiptPeriod: ReceiptPeriod
  notes?: string
  createdAt: string
}

export type FinanceBatch = {
  id: string
  createdAt: string
  createdBy: string // user id/email
  period: ReceiptPeriod
  totalAmount: number
  requestIds: string[]
  receiptIds: string[]
  status: 'QUEUED' | 'SENT' | 'PAID'
}

export const MAINTENANCE_RECORDS: MaintenanceRecord[] = []
export const MAINTENANCE_REQUESTS: MaintenanceRequest[] = []
export const FINANCE_QUEUE: FinanceBatch[] = []

export function nextMaintenanceId(prefix: 'MR'|'MQ'|'FB'): string {
  // MR: maintenance record, MQ: maintenance request, FB: finance batch
  if (prefix === 'MR') return `MR-${String(MAINTENANCE_RECORDS.length + 1).padStart(3,'0')}`
  if (prefix === 'MQ') return `MQ-${String(MAINTENANCE_REQUESTS.length + 1).padStart(3,'0')}`
  return `FB-${String(FINANCE_QUEUE.length + 1).padStart(3,'0')}`
}

export function nextWorkflowId(prefix: 'ASN'|'RPTW'): string {
  const arr = prefix === 'ASN' ? WORKFLOW_ASSIGNMENTS : WORKFLOW_REPORTS;
  const n = arr.length + 1;
  return `${prefix}-${String(n).padStart(3,'0')}`;
}
// Field & Overtime Requests
export type ApprovalStatus = 'DRAFT'|'PENDING_DEPT'|'PENDING_HRM'|'APPROVED'|'REJECTED';

export type ApprovalStep = {
  by?: string; // reviewer id
  at?: string; // ISO timestamp
  action?: 'SUBMIT'|'APPROVE'|'REJECT'|'FORWARD';
  comments?: string;
};

export type BaseRequestCommon = {
  id: string;
  requesterId: string; // user id/email
  requesterName?: string;
  department?: string;
  departmentHeadId?: string; // reviewer at dept stage
  requestType: 'OVERTIME'|'FIELD';
  purposeType?: string;
  justification?: string;
  attachmentUrls?: Array<{ url: string; name?: string; size?: number; type?: string }>;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  history: ApprovalStep[];
};

export type OvertimeRequest = BaseRequestCommon & {
  overtimeType: 'Extra Time'|'Weekend';
  dates: string[]; // yyyy-mm-dd
  startTime?: string; // HH:MM
  endTime?: string;   // HH:MM
  durationType?: 'Half Time'|'Full Day';
};

export type FieldRequest = BaseRequestCommon & {
  location: 'In Addis Ababa'|'Out of Addis Ababa';
  fromDate: string; // yyyy-mm-dd
  toDate: string;   // yyyy-mm-dd
  numberOfDays: number; // auto-calculated
  startTime?: string; // optional HH:MM
  endTime?: string;   // optional HH:MM
  totalTime?: string; // optional, e.g., "6h 00m"
  durationType?: 'Half Day'|'Full Day';
  remarks?: string;
};

export const OVERTIME_REQUESTS: OvertimeRequest[] = [];
export const FIELD_REQUESTS: FieldRequest[] = [];

export function nextOvertimeId(): string {
  const n = OVERTIME_REQUESTS.length + 1;
  return `OT-${String(n).padStart(3,'0')}`;
}

export function nextFieldId(): string {
  const n = FIELD_REQUESTS.length + 1;
  return `FLD-${String(n).padStart(3,'0')}`;
}
// Friends, Blocks, Groups (separate stores)
export const FRIENDS: Array<{ id: string; a: string; b: string; createdAt: string }> = [
  { id: 'FR-001', a: 'U-002', b: 'U-003', createdAt: new Date().toISOString() },
]

export const BLOCKS: Array<{ id: string; blocker: string; blocked: string; createdAt: string }> = [
]

export type GroupMember = { userId: string; role: 'owner' | 'admin' | 'member' }
export const GROUPS: Array<{ id: string; name: string; members: GroupMember[]; createdAt: string }> = [
  { id: 'GRP-001', name: 'Operations Team', members: [
    { userId: 'U-002', role: 'owner' },
    { userId: 'U-003', role: 'member' },
    { userId: 'U-004', role: 'member' },
  ], createdAt: new Date().toISOString() },
]

export const PLATFORM_STORE: Record<ModuleKey, ItemRecord[]> = {
  tickets: [
    { id: 'T-001', title: 'Printer not working', status: 'open', priority: 'medium' },
  ],
  knowledge_base: [
    { id: 'K-001', title: 'How to reset password', category: 'accounts' },
  ],
  complaints: [
    { id: 'C-001', subject: 'Noise issue', status: 'new' },
  ],
  users: [
    { id: 'U-001', name: 'Admin', email: 'admin@example.com', role: 'ADMIN' },
    { id: 'U-002', name: 'Alice Staff', email: 'alice.staff@example.com', role: 'STAFF', department: 'Operations', team: 'Ops-A' },
    { id: 'U-003', name: 'Tom Team Lead', email: 'tom.tl@example.com', role: 'TEAM_LEAD', department: 'Operations', team: 'Ops-A' },
    { id: 'U-004', name: 'Dina Dept Head', email: 'dina.dh@example.com', role: 'DEPARTMENT_HEAD', department: 'Operations' },
    { id: 'U-005', name: 'Sami Strategy', email: 'sami.strategy@example.com', role: 'STRATEGY', department: 'Planning' },
    { id: 'U-009', name: 'Ruth Strategy Head', email: 'ruth.head.strategy@example.com', role: 'DEPARTMENT_HEAD', department: 'Planning' },
    { id: 'U-006', name: 'Beza Staff', email: 'beza.staff@example.com', role: 'STAFF', department: 'Finance', team: 'Fin-A' },
    { id: 'U-007', name: 'Mati Staff', email: 'mati.staff@example.com', role: 'STAFF', department: 'Operations', team: 'Ops-B' },
    { id: 'U-008', name: 'Liya Team Lead', email: 'liya.tl@example.com', role: 'TEAM_LEAD', department: 'Operations', team: 'Ops-B' },
  ],
  fleet: [
    { id: 'F-001', name: 'Sample Fleet Record', type: 'meta' },
  ],
  reports: [
    { id: 'RPT-001', name: 'Monthly Summary', period: '2025-09' },
  ],
  feedback: [
    { id: 'FB-001', message: 'Great service', rating: 5 },
  ],
  analytics: [
    { id: 'AN-001', metric: 'active_users', value: 120 },
  ],
  planning: [
    {
      id: 'PLN-001',
      title: 'Q4 Operational Plan - Team A',
      description: 'Initial draft for Q4 tasks and resource needs',
      owner: 'staff:u-1',
      status: 'DRAFT',
      // Planning workflow: PLANNING -> DEPARTMENT -> TEAM -> EMPLOYEE
      route: {
        chain: ['PLANNING','DEPARTMENT','TEAM','EMPLOYEE'],
        current: 'PLANNING'
      },
      approvals: [],
      history: [
        { by: 'staff:u-1', action: 'create', at: new Date().toISOString(), comments: '' },
      ],
    },
  ],
  messages: [
    { id: 'MSG-001', from: 'U-002', to: 'U-003', text: 'Hello Team Lead, I have submitted the plan.', createdAt: new Date().toISOString(), attachments: [], readBy: [] },
    { id: 'MSG-002', from: 'U-003', to: 'U-002', text: 'Received. I will review it.', createdAt: new Date().toISOString(), attachments: [], readBy: [] },
  ],
}

export function nextId(module: ModuleKey): string {
  const prefix: Record<ModuleKey, string> = {
    tickets: 'T', knowledge_base: 'K', complaints: 'C', users: 'U', fleet: 'F', reports: 'RPT', feedback: 'FB', analytics: 'AN', planning: 'PLN', messages: 'MSG'
  }
  const arr = PLATFORM_STORE[module]
  const n = arr.length + 1
  const p = prefix[module]
  const pad = p === 'RPT' ? 3 : 3
  return `${p}-${String(n).padStart(pad, '0')}`
}
