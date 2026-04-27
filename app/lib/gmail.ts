/**
 * Gmail API wrapper — thin helpers over `googleapis`, used by the Inbox
 * routes. Per-request: refresh access token, make the call, return shaped
 * data. No caching yet — Week 4 adds a 5-min TTL + history.list sync.
 */

import { google, gmail_v1 } from "googleapis";
import { getTokenForUser, markError } from "./gmail-tokens";
import { getCurrentUserEmail } from "./auth";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/drive.readonly",
];

export const GMAIL_OAUTH_SCOPES = GMAIL_SCOPES;

const getRedirectUri = (): string => {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/gmail/callback`;
};

export const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Gmail OAuth not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET."
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
};

export const buildAuthUrl = (state: string): string => {
  const oauth = getOAuth2Client();
  return oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // always return a refresh_token
    scope: GMAIL_SCOPES,
    state,
    include_granted_scopes: true,
  });
};

export const exchangeCodeForTokens = async (code: string) => {
  const oauth = getOAuth2Client();
  const { tokens } = await oauth.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return a refresh_token. Try disconnecting and reconnecting."
    );
  }
  // Fetch the connected Gmail address
  oauth.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth });
  const profile = await gmail.users.getProfile({ userId: "me" });
  return {
    refreshToken: tokens.refresh_token,
    gmailAddress: profile.data.emailAddress ?? "",
    scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
  };
};

/**
 * Get an authenticated gmail client for the current portal user. Reads the
 * NextAuth session to identify which user's Gmail token to use. Returns null
 * when there is no session, or when the user hasn't connected their Gmail.
 */
export const getGmailClient = async (): Promise<{
  gmail: gmail_v1.Gmail;
  gmailAddress: string;
} | null> => {
  const portalUser = await getCurrentUserEmail();
  if (!portalUser) return null;

  const token = await getTokenForUser(portalUser);
  if (!token) return null;

  const oauth = getOAuth2Client();
  oauth.setCredentials({ refresh_token: token.refreshToken });

  try {
    // Force a refresh round-trip so we catch revoked tokens up-front
    await oauth.getAccessToken();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markError(portalUser, msg);
    return null;
  }

  const gmail = google.gmail({ version: "v1", auth: oauth });
  return { gmail, gmailAddress: token.gmailAddress };
};

// ---- Shaping helpers --------------------------------------------------

export interface ThreadSummary {
  threadId: string;
  subject: string;
  snippet: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string; // ISO
  unread: boolean;
  messageCount: number;
  labelIds: string[];
  hasAttachments: boolean;
}

export interface ThreadMessage {
  messageId: string;
  threadId: string;
  from: string;
  fromEmail: string;
  to: string;
  cc: string;
  subject: string;
  date: string; // ISO
  unread: boolean;
  body: string; // plaintext
  bodyHtml: string | null;
  snippet: string;
  labelIds: string[];
  attachments: { attachmentId: string; filename: string; mimeType: string; size: number }[];
}

export interface ThreadDetail {
  threadId: string;
  subject: string;
  messages: ThreadMessage[];
}

const headerMap = (headers: gmail_v1.Schema$MessagePartHeader[] | undefined) => {
  const m: Record<string, string> = {};
  for (const h of headers ?? []) {
    if (h.name) m[h.name.toLowerCase()] = h.value ?? "";
  }
  return m;
};

const parseFromAddress = (raw: string): { name: string; email: string } => {
  if (!raw) return { name: "", email: "" };
  const m = raw.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].replace(/"/g, "").trim(), email: m[2].trim() };
  return { name: "", email: raw.trim() };
};

const decodeBody = (data: string | null | undefined): string => {
  if (!data) return "";
  // Gmail uses URL-safe base64
  const fixed = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(fixed, "base64").toString("utf-8");
  } catch {
    return "";
  }
};

const walkParts = (
  part: gmail_v1.Schema$MessagePart | undefined
): {
  plain: string;
  html: string | null;
  attachments: ThreadMessage["attachments"];
} => {
  if (!part) return { plain: "", html: null, attachments: [] };

  const attachments: ThreadMessage["attachments"] = [];
  let plain = "";
  let html: string | null = null;

  const walk = (p: gmail_v1.Schema$MessagePart) => {
    const mime = p.mimeType || "";
    if (p.filename && p.body?.attachmentId) {
      attachments.push({
        attachmentId: p.body.attachmentId,
        filename: p.filename,
        mimeType: mime,
        size: p.body.size ?? 0,
      });
    }
    if (mime === "text/plain" && p.body?.data) {
      plain += (plain ? "\n" : "") + decodeBody(p.body.data);
    } else if (mime === "text/html" && p.body?.data) {
      const h = decodeBody(p.body.data);
      html = html ? `${html}\n${h}` : h;
    }
    for (const child of p.parts ?? []) walk(child);
  };

  walk(part);
  return { plain, html, attachments };
};

const messageToShaped = (msg: gmail_v1.Schema$Message): ThreadMessage => {
  const h = headerMap(msg.payload?.headers);
  const { plain, html, attachments } = walkParts(msg.payload);
  const { name, email } = parseFromAddress(h.from || "");
  const dateMs = Number(msg.internalDate ?? 0);
  return {
    messageId: msg.id ?? "",
    threadId: msg.threadId ?? "",
    from: name || email,
    fromEmail: email,
    to: h.to || "",
    cc: h.cc || "",
    subject: h.subject || "(no subject)",
    date: dateMs ? new Date(dateMs).toISOString() : new Date().toISOString(),
    unread: (msg.labelIds ?? []).includes("UNREAD"),
    body: plain,
    bodyHtml: html,
    snippet: msg.snippet ?? "",
    labelIds: msg.labelIds ?? [],
    attachments,
  };
};

// ---- Cache (module-level, per server instance) -----------------------

interface CachedInbox {
  value: { threads: ThreadSummary[]; nextPageToken?: string; historyId?: string };
  expiresAt: number;
}
interface CachedThread {
  value: ThreadDetail;
  expiresAt: number;
}

const INBOX_TTL_MS = 5 * 60 * 1000; // 5 minutes — per spec
const THREAD_TTL_MS = 60 * 1000; // 1 minute — read-heavy detail view

// Shared via globalThis so caches are consistent across Next.js route
// bundles (each route can otherwise own its own module instance).
const _g = globalThis as typeof globalThis & {
  __ccGmailInboxCache?: Map<string, CachedInbox>;
  __ccGmailThreadCache?: Map<string, CachedThread>;
};
const inboxCache: Map<string, CachedInbox> =
  _g.__ccGmailInboxCache ?? (_g.__ccGmailInboxCache = new Map());
const threadCache: Map<string, CachedThread> =
  _g.__ccGmailThreadCache ?? (_g.__ccGmailThreadCache = new Map());

const inboxCacheKey = (
  gmailAddress: string,
  opts: { maxResults?: number; q?: string; labelIds?: string[]; pageToken?: string }
): string =>
  `${gmailAddress}::${opts.q || ""}::${(opts.labelIds || ["INBOX"]).join(",")}::${
    opts.pageToken || ""
  }::${opts.maxResults ?? 50}`;

const threadCacheKey = (gmailAddress: string, threadId: string): string =>
  `${gmailAddress}::${threadId}`;

/**
 * Drop all cached inbox + thread entries for a user. Called by every
 * write helper (mark-read, modify-labels, send, reply) so subsequent
 * reads see the new state.
 */
export const invalidateGmailCache = (gmailAddress: string, threadId?: string): void => {
  for (const key of inboxCache.keys()) {
    if (key.startsWith(`${gmailAddress}::`)) inboxCache.delete(key);
  }
  if (threadId) {
    threadCache.delete(threadCacheKey(gmailAddress, threadId));
  } else {
    for (const key of threadCache.keys()) {
      if (key.startsWith(`${gmailAddress}::`)) threadCache.delete(key);
    }
  }
};

/**
 * Get the current Gmail historyId via users.getProfile. Cheap call
 * (~30ms), useful for clients that want to do incremental sync via
 * users.history.list later.
 */
export const getCurrentHistoryId = async (): Promise<string | undefined> => {
  const client = await getGmailClient();
  if (!client) throw new Error("Gmail not connected");
  const p = await client.gmail.users.getProfile({ userId: "me" });
  return p.data.historyId ?? undefined;
};

// ---- Operations -------------------------------------------------------

export const listInbox = async (opts: {
  maxResults?: number;
  q?: string;
  labelIds?: string[];
  pageToken?: string;
  noCache?: boolean;
}): Promise<{ threads: ThreadSummary[]; nextPageToken?: string; historyId?: string }> => {
  const client = await getGmailClient();
  if (!client) throw new Error("Gmail not connected");

  const cacheKey = inboxCacheKey(client.gmailAddress, opts);
  if (!opts.noCache) {
    const hit = inboxCache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) return hit.value;
  }

  const list = await client.gmail.users.threads.list({
    userId: "me",
    maxResults: opts.maxResults ?? 50,
    q: opts.q || undefined,
    labelIds: opts.labelIds ?? ["INBOX"],
    pageToken: opts.pageToken,
  });

  const threadIds = (list.data.threads ?? [])
    .map((t) => t.id)
    .filter((id): id is string => Boolean(id));

  // Pull a minimal representation of each thread — metadata only for speed
  const threads: ThreadSummary[] = [];
  for (const id of threadIds) {
    try {
      const t = await client.gmail.users.threads.get({
        userId: "me",
        id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });
      const msgs = t.data.messages ?? [];
      if (msgs.length === 0) continue;
      const latest = msgs[msgs.length - 1];
      const h = headerMap(latest.payload?.headers);
      const { name, email } = parseFromAddress(h.from || "");
      const hasAttachments = msgs.some((m) =>
        (m.payload?.parts ?? []).some((p) => !!p.filename)
      );
      const dateMs = Number(latest.internalDate ?? 0);
      threads.push({
        threadId: id,
        subject: h.subject || "(no subject)",
        snippet: latest.snippet ?? "",
        from: name || email,
        fromEmail: email,
        to: h.to || "",
        date: dateMs ? new Date(dateMs).toISOString() : new Date().toISOString(),
        unread: (latest.labelIds ?? []).includes("UNREAD"),
        messageCount: msgs.length,
        labelIds: latest.labelIds ?? [],
        hasAttachments,
      });
    } catch (err) {
      console.error(`[Gmail] failed thread ${id}:`, err);
    }
  }

  // Capture the user's current historyId so clients can later do
  // incremental sync via users.history.list. Cheap follow-up call.
  let historyId: string | undefined;
  try {
    const profile = await client.gmail.users.getProfile({ userId: "me" });
    historyId = profile.data.historyId ?? undefined;
  } catch {
    /* non-fatal */
  }

  const value = {
    threads,
    nextPageToken: list.data.nextPageToken ?? undefined,
    historyId,
  };
  inboxCache.set(cacheKey, { value, expiresAt: Date.now() + INBOX_TTL_MS });
  return value;
};

export const getThread = async (
  threadId: string,
  opts: { noCache?: boolean } = {}
): Promise<ThreadDetail> => {
  const client = await getGmailClient();
  if (!client) throw new Error("Gmail not connected");

  const cacheKey = threadCacheKey(client.gmailAddress, threadId);
  if (!opts.noCache) {
    const hit = threadCache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) return hit.value;
  }

  const t = await client.gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });

  const messages = (t.data.messages ?? []).map(messageToShaped);
  const subject = messages[0]?.subject ?? "(no subject)";
  const value: ThreadDetail = { threadId, subject, messages };
  threadCache.set(cacheKey, { value, expiresAt: Date.now() + THREAD_TTL_MS });
  return value;
};

export const markThreadRead = async (threadId: string): Promise<void> => {
  const client = await getGmailClient();
  if (!client) throw new Error("Gmail not connected");
  await client.gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: { removeLabelIds: ["UNREAD"] },
  });
  invalidateGmailCache(client.gmailAddress, threadId);
};

// ---- Labels ----------------------------------------------------------

export interface GmailLabel {
  id: string;
  name: string;
  type: "system" | "user";
}

/**
 * List labels for the active user. Returns user-created labels by
 * default; system labels (INBOX, SENT, etc.) only when `includeSystem`
 * is true. Used by the portal label picker.
 */
export const listLabels = async (
  opts: { includeSystem?: boolean } = {}
): Promise<GmailLabel[]> => {
  const client = await getGmailClient();
  if (!client) throw new Error("Gmail not connected");
  const res = await client.gmail.users.labels.list({ userId: "me" });
  const labels = (res.data.labels ?? []).map((l) => ({
    id: l.id ?? "",
    name: l.name ?? "",
    type: (l.type === "system" ? "system" : "user") as "system" | "user",
  }));
  return opts.includeSystem ? labels : labels.filter((l) => l.type === "user");
};

/**
 * Apply add/remove label changes to a thread (and all its messages).
 * IDs come from `listLabels()`. Returns the updated label IDs for the
 * thread's latest message so the UI can confirm.
 */
export const modifyThreadLabels = async (
  threadId: string,
  changes: { add?: string[]; remove?: string[] }
): Promise<string[]> => {
  const client = await getGmailClient();
  if (!client) throw new Error("Gmail not connected");
  const res = await client.gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: {
      addLabelIds: changes.add ?? [],
      removeLabelIds: changes.remove ?? [],
    },
  });
  invalidateGmailCache(client.gmailAddress, threadId);
  const msgs = res.data.messages ?? [];
  return msgs.length > 0 ? (msgs[msgs.length - 1].labelIds ?? []) : [];
};

// ---- Send / Reply ----------------------------------------------------

const encodeHeader = (v: string): string => {
  // RFC 2047 encoded-word for any non-ASCII header value
  // eslint-disable-next-line no-control-regex
  return /[^\x00-\x7F]/.test(v) ? `=?UTF-8?B?${Buffer.from(v, "utf8").toString("base64")}?=` : v;
};

const buildRfc822 = (opts: {
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
}): string => {
  const headers: string[] = [];
  headers.push(`From: ${opts.from}`);
  headers.push(`To: ${opts.to}`);
  if (opts.cc) headers.push(`Cc: ${opts.cc}`);
  if (opts.bcc) headers.push(`Bcc: ${opts.bcc}`);
  headers.push(`Subject: ${encodeHeader(opts.subject)}`);
  if (opts.inReplyTo) headers.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) headers.push(`References: ${opts.references}`);
  headers.push("MIME-Version: 1.0");
  headers.push('Content-Type: text/plain; charset="UTF-8"');
  headers.push("Content-Transfer-Encoding: 7bit");
  return `${headers.join("\r\n")}\r\n\r\n${opts.body}`;
};

const base64UrlEncode = (raw: string): string =>
  Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export interface SendResult {
  messageId: string;
  threadId: string;
}

export const sendMessage = async (input: {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
}): Promise<SendResult> => {
  const client = await getGmailClient();
  if (!client) throw new Error("Gmail not connected");

  const raw = base64UrlEncode(
    buildRfc822({ from: client.gmailAddress, ...input })
  );
  const res = await client.gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
  invalidateGmailCache(client.gmailAddress);
  return {
    messageId: res.data.id ?? "",
    threadId: res.data.threadId ?? "",
  };
};

export const replyToThread = async (input: {
  threadId: string;
  body: string;
  cc?: string;
}): Promise<SendResult> => {
  const client = await getGmailClient();
  if (!client) throw new Error("Gmail not connected");

  // Fetch the last message in the thread to derive reply headers
  const t = await client.gmail.users.threads.get({
    userId: "me",
    id: input.threadId,
    format: "metadata",
    metadataHeaders: ["From", "To", "Cc", "Subject", "Message-ID", "References"],
  });
  const msgs = t.data.messages ?? [];
  if (msgs.length === 0) throw new Error("Thread has no messages");
  const last = msgs[msgs.length - 1];
  const h = headerMap(last.payload?.headers);

  // Reply goes back to the original sender
  const replyTo = h.from || "";
  const messageId = h["message-id"] || "";
  const references = h.references ? `${h.references} ${messageId}` : messageId;
  const subject = h.subject?.toLowerCase().startsWith("re:")
    ? h.subject
    : `Re: ${h.subject ?? ""}`;

  const raw = base64UrlEncode(
    buildRfc822({
      from: client.gmailAddress,
      to: replyTo,
      cc: input.cc,
      subject,
      body: input.body,
      inReplyTo: messageId,
      references,
    })
  );

  const res = await client.gmail.users.messages.send({
    userId: "me",
    requestBody: { raw, threadId: input.threadId },
  });
  invalidateGmailCache(client.gmailAddress, input.threadId);
  return {
    messageId: res.data.id ?? "",
    threadId: res.data.threadId ?? input.threadId,
  };
};

// ---- Attachments -----------------------------------------------------

export interface AttachmentBlob {
  data: Buffer;
  filename: string;
  mimeType: string;
}

export const getAttachment = async (
  messageId: string,
  attachmentId: string
): Promise<AttachmentBlob> => {
  const client = await getGmailClient();
  if (!client) throw new Error("Gmail not connected");

  // Fetch attachment metadata from the message to recover filename + mime
  const msg = await client.gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  let filename = "attachment";
  let mimeType = "application/octet-stream";
  const findPart = (p: gmail_v1.Schema$MessagePart | undefined): boolean => {
    if (!p) return false;
    if (p.body?.attachmentId === attachmentId) {
      filename = p.filename || filename;
      mimeType = p.mimeType || mimeType;
      return true;
    }
    for (const child of p.parts ?? []) {
      if (findPart(child)) return true;
    }
    return false;
  };
  findPart(msg.data.payload ?? undefined);

  const res = await client.gmail.users.messages.attachments.get({
    userId: "me",
    messageId,
    id: attachmentId,
  });
  const data64 = (res.data.data ?? "").replace(/-/g, "+").replace(/_/g, "/");
  return {
    data: Buffer.from(data64, "base64"),
    filename,
    mimeType,
  };
};
