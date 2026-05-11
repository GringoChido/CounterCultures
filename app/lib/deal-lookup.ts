import { readSheet } from "./dashboard-sheets";

interface PipelineRow extends Record<string, string> {
  id: string;
  email: string;
  phone: string;
  stage: string;
}

const TERMINAL_STAGES = new Set([
  "closed-won", "won", "complete", "closed-lost", "lost", "abandoned",
]);

export async function findActiveDealByEmail(email: string): Promise<string | null> {
  if (!email) return null;
  const rows = await readSheet<PipelineRow>("Pipeline");
  const normalEmail = email.toLowerCase().trim();
  const match = rows
    .filter((r) => r.email?.toLowerCase().trim() === normalEmail && !TERMINAL_STAGES.has(r.stage))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  return match[0]?.id ?? null;
}

export async function findActiveDealByPhone(phone: string): Promise<string | null> {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length < 10) return null;
  const rows = await readSheet<PipelineRow>("Pipeline");
  const match = rows
    .filter((r) => {
      const rowDigits = (r.phone ?? "").replace(/\D/g, "").slice(-10);
      return rowDigits === digits && !TERMINAL_STAGES.has(r.stage);
    })
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  return match[0]?.id ?? null;
}
