import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type PlanOrReport = {
  id: string;
  kind: "plan" | "report";
  title: string;
  periodType?: string;
  startDate?: string;
  endDate?: string;
  objectives?: string;
  activities?: string[];
  resources?: string;
  expectedOutcome?: string;
  challenges?: string;
  recommendations?: string;
  receiverId?: string;
  currentRole?: string;
  attachments?: Array<{ filename: string; relPath: string; size: number }>;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "plan-report.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readDb(): Promise<{ items: PlanOrReport[] }> {
  await ensureDirs();
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { items: [] };
  }
}

async function writeDb(db: { items: PlanOrReport[] }) {
  await ensureDirs();
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

export async function listItems(kind?: "plan" | "report") {
  const db = await readDb();
  return kind ? db.items.filter((i) => i.kind === kind) : db.items;
}

export async function addItem(input: Omit<PlanOrReport, "id" | "createdAt">): Promise<PlanOrReport> {
  const db = await readDb();
  const item: PlanOrReport = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  db.items.unshift(item);
  await writeDb(db);
  return item;
}

export async function saveUpload(buffer: Buffer, originalName: string, subdir: string = "") {
  await ensureDirs();
  const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const dir = path.join(UPLOADS_DIR, subdir);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, safeName);
  await fs.writeFile(filePath, buffer);
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  return { filename: originalName, relPath };
}
