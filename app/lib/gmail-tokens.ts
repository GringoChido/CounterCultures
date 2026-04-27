/**
 * Gmail token store — one row per connected Gmail address.
 *
 * Refresh tokens are encrypted at rest with AES-256-GCM using
 * SESSION_SECRET (already required by the auth layer) as the key source.
 * Never written in plaintext to the sheet.
 *
 * V1 is single-account: the portal reads the most recently connected
 * `active` row for all API calls. Multi-user support is Phase 2.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "crypto";
import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "./dashboard-sheets";

const ALGO = "aes-256-gcm";

const getKey = (): Buffer => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env var is required");
  // 32-byte key derived from SESSION_SECRET via SHA-256
  return createHash("sha256").update(secret).digest();
};

const encrypt = (plain: string): string => {
  const iv = randomBytes(12); // GCM standard nonce length
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: base64(iv):base64(tag):base64(ciphertext)
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
};

const decrypt = (packed: string): string => {
  const [ivB64, tagB64, encB64] = packed.split(":");
  if (!ivB64 || !tagB64 || !encB64) {
    throw new Error("Malformed encrypted token");
  }
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const enc = Buffer.from(encB64, "base64");
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
};

export type GmailTokenRecord = Record<string, string> & {
  user_email: string;
  refresh_token_encrypted: string;
  gmail_address: string;
  connected_at: string;
  last_refresh_at: string;
  last_error: string;
  status: "active" | "revoked" | "error";
  scopes: string;
};

interface GmailToken {
  userEmail: string;
  refreshToken: string; // plaintext — only returned to server-side callers
  gmailAddress: string;
  connectedAt: string;
  lastRefreshAt: string;
  lastError: string;
  status: "active" | "revoked" | "error";
  scopes: string[];
}

const COLUMNS: (keyof GmailTokenRecord)[] = [
  "user_email",
  "refresh_token_encrypted",
  "gmail_address",
  "connected_at",
  "last_refresh_at",
  "last_error",
  "status",
  "scopes",
];

const toToken = (r: GmailTokenRecord): GmailToken => ({
  userEmail: r.user_email,
  refreshToken: decrypt(r.refresh_token_encrypted),
  gmailAddress: r.gmail_address,
  connectedAt: r.connected_at,
  lastRefreshAt: r.last_refresh_at,
  lastError: r.last_error,
  status: (r.status || "active") as GmailToken["status"],
  scopes: (r.scopes || "").split("|").filter(Boolean),
});

export const saveToken = async (input: {
  /** Portal user (signed-in identity) owning this Gmail connection. */
  portalUserEmail: string;
  /** Gmail address of the connected mailbox (may differ from portalUserEmail). */
  gmailAddress: string;
  refreshToken: string;
  scopes: string[];
}): Promise<void> => {
  const portalUser = input.portalUserEmail.trim().toLowerCase();
  const encrypted = encrypt(input.refreshToken);
  const now = new Date().toISOString();
  const row: GmailTokenRecord = {
    user_email: portalUser,
    refresh_token_encrypted: encrypted,
    gmail_address: input.gmailAddress,
    connected_at: now,
    last_refresh_at: now,
    last_error: "",
    status: "active",
    scopes: input.scopes.join("|"),
  };

  const existingIdx = await findRowIndex(
    "Gmail_Tokens",
    "user_email",
    portalUser
  );
  const values = COLUMNS.map((c) => row[c]);
  if (existingIdx === null) {
    await appendRow("Gmail_Tokens", values);
  } else {
    await updateRow("Gmail_Tokens", existingIdx, values);
  }
};

export const markError = async (
  portalUserEmail: string,
  message: string
): Promise<void> => {
  const target = portalUserEmail.trim().toLowerCase();
  const idx = await findRowIndex("Gmail_Tokens", "user_email", target);
  if (idx === null) return;
  const rows = await readSheet<GmailTokenRecord>("Gmail_Tokens");
  const current = rows[idx];
  if (!current) return;
  const updated: GmailTokenRecord = {
    ...current,
    status: "error",
    last_error: message.slice(0, 500),
  };
  await updateRow(
    "Gmail_Tokens",
    idx,
    COLUMNS.map((c) => updated[c])
  );
};

export const markRevoked = async (portalUserEmail: string): Promise<void> => {
  const target = portalUserEmail.trim().toLowerCase();
  const idx = await findRowIndex("Gmail_Tokens", "user_email", target);
  if (idx === null) return;
  const rows = await readSheet<GmailTokenRecord>("Gmail_Tokens");
  const current = rows[idx];
  if (!current) return;
  const updated: GmailTokenRecord = {
    ...current,
    status: "revoked",
    refresh_token_encrypted: "",
  };
  await updateRow(
    "Gmail_Tokens",
    idx,
    COLUMNS.map((c) => updated[c])
  );
};

/**
 * Per-user Gmail token lookup. Each portal user (sales rep, finance, owner)
 * connects their own Gmail; lookups key off the session email. Replaces the
 * old "first active" hack that broke as soon as more than one person used
 * the portal.
 */
export const getTokenForUser = async (
  userEmail: string
): Promise<GmailToken | null> => {
  const target = userEmail.trim().toLowerCase();
  if (!target) return null;
  const rows = await readSheet<GmailTokenRecord>("Gmail_Tokens");
  const match = rows.find(
    (r) =>
      r.user_email?.toLowerCase() === target &&
      r.status === "active" &&
      r.refresh_token_encrypted
  );
  if (!match) return null;
  try {
    return toToken(match);
  } catch (err) {
    console.error("[gmail-tokens] decrypt failed:", err);
    return null;
  }
};

/**
 * Status snapshot for the Settings UI — never returns the plaintext token.
 */
export const getStatusForUser = async (
  userEmail: string
): Promise<{
  connected: boolean;
  gmailAddress?: string;
  connectedAt?: string;
  lastError?: string;
  scopes?: string[];
}> => {
  const target = userEmail.trim().toLowerCase();
  if (!target) return { connected: false };
  const rows = await readSheet<GmailTokenRecord>("Gmail_Tokens");
  const match = rows.find(
    (r) => r.user_email?.toLowerCase() === target && r.status === "active"
  );
  if (!match || !match.refresh_token_encrypted) return { connected: false };
  return {
    connected: true,
    gmailAddress: match.gmail_address,
    connectedAt: match.connected_at,
    lastError: match.last_error || undefined,
    scopes: (match.scopes || "").split("|").filter(Boolean),
  };
};
