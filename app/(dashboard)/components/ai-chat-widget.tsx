"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { usePageContextStore, renderPageContext } from "@/app/lib/stores/page-context-store";
import DOMPurify from "dompurify";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Minimize2,
  Maximize2,
  Trash2,
  Paperclip,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { ChatToolChip } from "./chat-tool-chip";
import { useCurrentUser } from "@/app/lib/use-current-user";

interface ToolCall {
  id: string;
  name: string;
  input?: unknown;
  preview?: string;
  status: "running" | "ok" | "error";
}

interface Attachment {
  id: string;
  name: string;
  mediaType: string;
  data: string; // base64 (no data: prefix)
  size: number;
}

interface MessageAttachment {
  id: string;
  name: string;
  mediaType: string;
  size: number;
  url?: string; // populated once Drive upload completes
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  attachments?: MessageAttachment[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_ATTACHMENTS = 5;
const ACCEPTED_TYPES = "image/png,image/jpeg,image/gif,image/webp,application/pdf";

const readAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

// 3 conversational starters (replaces v1's 7 hardcoded actions). Each
// is a message-only prompt — no navigate-and-close shortcuts. The agent
// drives everything from inside the chat.
const STARTER_PROMPTS = [
  "What's new today?",
  "Find a contact",
  "Show this week's numbers",
] as const;

const DISMISSED_KEY = "cc_chat_dismissed_session";
const HISTORY_KEY = "cc_chat_history_v2";
const HISTORY_CAP = 50;

const firstNameOf = (name: string | null | undefined): string =>
  (name ?? "").trim().split(/\s+/)[0] ?? "";

// Minimal markdown renderer for assistant messages
function RichText({ text }: { text: string }) {
  const lines = text.split("\n");

  const sanitize = (html: string) =>
    DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["strong", "a"],
      ALLOWED_ATTR: ["href", "target", "rel", "class"],
    });

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const processed = line.replace(
          /\*\*(.+?)\*\*/g,
          '<strong class="font-semibold text-dash-text">$1</strong>'
        );

        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-1.5 pl-1">
              <span className="text-brand-copper mt-0.5 shrink-0">•</span>
              <span
                dangerouslySetInnerHTML={{
                  __html: sanitize(processed.replace(/^[-•]\s*/, "")),
                }}
              />
            </div>
          );
        }

        const withLinks = processed.replace(
          /(https:\/\/(?:docs\.google\.com|drive\.google\.com)[^\s)]+)/g,
          '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-brand-copper underline underline-offset-2 hover:text-brand-copper/80">Open in Google →</a>'
        );

        if (line.trim() === "") {
          return <div key={i} className="h-1" />;
        }

        return (
          <p
            key={i}
            className="leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitize(withLinks) }}
          />
        );
      })}
    </div>
  );
}

export function AIChatWidget({ hideOwnFab = false }: { hideOwnFab?: boolean } = {}) {
  const pathname = usePathname();
  const selectedDeal = usePageContextStore((s) => s.selectedDeal);
  const selectedLead = usePageContextStore((s) => s.selectedLead);
  const setPathname = usePageContextStore((s) => s.setPathname);

  // Keep pathname in store mirror so other consumers can read it
  useEffect(() => {
    setPathname(pathname || "");
  }, [pathname, setPathname]);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const { user } = useCurrentUser();
  const name = firstNameOf(user?.name);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Load saved conversation history. Closed-by-default (per redesign §9 — chat is a tool, not a popup).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed)) {
          setMessages(
            parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
          );
        }
      }
    } catch {
      // storage not available — fall through
    }
  }, []);

  // Open via external event from <ActionFab>.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("cc:open-chat", handler);
    return () => window.removeEventListener("cc:open-chat", handler);
  }, []);

  // Persist conversation on every change (capped to last HISTORY_CAP)
  useEffect(() => {
    try {
      if (messages.length === 0) return;
      const trimmed = messages.slice(-HISTORY_CAP);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch {
      // ignore
    }
  }, [messages]);

  const closeWidget = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  };

  const sendMessage = useCallback(
    async (text: string, files: Attachment[] = []) => {
      if ((!text.trim() && files.length === 0) || loading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
        attachments: files.length
          ? files.map(({ id, name, mediaType, size }) => ({
              id,
              name,
              mediaType,
              size,
            }))
          : undefined,
      };
      const assistantId = `a-${Date.now()}`;
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        toolCalls: [],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setAttachments([]);
      setAttachError(null);
      setLoading(true);

      const updateAssistant = (mut: (m: Message) => Message) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? mut(m) : m))
        );
      };

      try {
        const apiMessages = [...messagesRef.current, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const pageContext = renderPageContext({
          pathname,
          selectedDeal,
          selectedLead,
        });

        const res = await fetch("/api/dashboard-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            pageContext: pageContext || undefined,
            attachments: files.length
              ? files.map((f) => ({
                  id: f.id,
                  name: f.name,
                  mediaType: f.mediaType,
                  data: f.data,
                }))
              : undefined,
          }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "");
          updateAssistant((m) => ({
            ...m,
            content: errText || "Sorry, I couldn't process that.",
          }));
          return;
        }

        // Parse SSE frames from a streamed POST response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Split on double-newline = end of one SSE frame
          let nlIdx: number;
          while ((nlIdx = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, nlIdx);
            buffer = buffer.slice(nlIdx + 2);

            let event = "message";
            let dataLine = "";
            for (const line of frame.split("\n")) {
              if (line.startsWith("event: ")) event = line.slice(7).trim();
              else if (line.startsWith("data: ")) dataLine = line.slice(6);
            }
            if (!dataLine) continue;

            let payload: Record<string, unknown> = {};
            try {
              payload = JSON.parse(dataLine) as Record<string, unknown>;
            } catch {
              continue;
            }

            if (event === "text") {
              const delta = (payload.text as string) ?? "";
              updateAssistant((m) => ({ ...m, content: m.content + delta }));
            } else if (event === "tool_use") {
              const tc: ToolCall = {
                id: payload.id as string,
                name: payload.name as string,
                input: payload.input,
                status: "running",
              };
              updateAssistant((m) => ({
                ...m,
                toolCalls: [...(m.toolCalls ?? []), tc],
              }));
            } else if (event === "tool_result") {
              const id = payload.id as string;
              const preview = payload.preview as string;
              updateAssistant((m) => ({
                ...m,
                toolCalls: (m.toolCalls ?? []).map((c) =>
                  c.id === id ? { ...c, preview, status: "ok" } : c
                ),
              }));
            } else if (event === "attachment_stored") {
              const attId = payload.id as string;
              const url = payload.url as string;
              setMessages((prev) =>
                prev.map((m) =>
                  m.attachments && m.attachments.some((a) => a.id === attId)
                    ? {
                        ...m,
                        attachments: m.attachments.map((a) =>
                          a.id === attId ? { ...a, url } : a
                        ),
                      }
                    : m
                )
              );
            } else if (event === "error") {
              const errMsg = (payload.message as string) || "Stream error";
              updateAssistant((m) => ({
                ...m,
                content: m.content + `\n\n_Error: ${errMsg}_`,
              }));
            } else if (event === "done") {
              // No-op — loop will exit on stream close
            }
          }
        }

        // If nothing came back at all, show a fallback
        updateAssistant((m) =>
          m.content || (m.toolCalls && m.toolCalls.length)
            ? m
            : { ...m, content: "I processed that but have nothing to add." }
        );
      } catch (err) {
        console.error("[Chat stream]", err);
        updateAssistant((m) => ({
          ...m,
          content:
            m.content ||
            "Connection error. Please try again.",
        }));
      } finally {
        setLoading(false);
      }
    },
    [loading, pathname, selectedDeal, selectedLead]
  );

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  };

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setAttachError(null);
      const files = Array.from(fileList);
      const room = MAX_ATTACHMENTS - attachments.length;
      if (room <= 0) {
        setAttachError(`Max ${MAX_ATTACHMENTS} attachments per message.`);
        return;
      }
      const accepted: Attachment[] = [];
      for (const file of files.slice(0, room)) {
        if (
          !file.type.startsWith("image/") &&
          file.type !== "application/pdf"
        ) {
          setAttachError(`Skipped ${file.name} — only images and PDFs.`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setAttachError(`${file.name} is over 5 MB.`);
          continue;
        }
        try {
          const data = await readAsBase64(file);
          accepted.push({
            id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            mediaType: file.type,
            data,
            size: file.size,
          });
        } catch {
          setAttachError(`Couldn't read ${file.name}.`);
        }
      }
      if (accepted.length) {
        setAttachments((prev) => [...prev, ...accepted]);
      }
    },
    [attachments.length]
  );

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    setAttachError(null);
  };

  const widthClass = expanded ? "w-[500px] max-w-[calc(100vw-2rem)]" : "w-[380px] max-w-[calc(100vw-2rem)]";
  const heightClass = expanded ? "h-[640px] max-h-[calc(100dvh-6rem)]" : "h-[520px] max-h-[calc(100dvh-6rem)]";

  return (
    <>
      {open && (
        <div
          className={`fixed bottom-20 right-6 ${widthClass} ${heightClass} z-50 flex flex-col bg-dash-surface rounded-2xl border border-dash-border shadow-2xl overflow-hidden transition-all duration-200`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-dash-sidebar text-white border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-copper flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Dashboard Assistant</p>
                <p className="text-[10px] text-white/50">
                  Connected to CRM, Drive &amp; Sheets
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear chat"
                  aria-label="Clear chat"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white/50" />
                </button>
              )}
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                {expanded ? (
                  <Minimize2 className="w-4 h-4 text-white/70" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-white/70" />
                )}
              </button>
              <button
                onClick={closeWidget}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="pt-1 pb-2">
                  <p className="text-base font-semibold text-dash-text mb-1">
                    {name ? `Hello ${name},` : "Hello,"}
                  </p>
                  <p className="text-sm text-dash-text-secondary">
                    what can I help you with today?
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary px-1">
                    Try
                  </p>
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs text-dash-text bg-dash-bg rounded-lg border border-dash-border hover:border-brand-copper/40 hover:bg-brand-copper/5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-brand-copper/70 shrink-0" />
                      {p}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-dash-text-secondary/60 px-1 pt-1">
                  Or type anything — I know every page, every field, every
                  brand.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-brand-copper text-white rounded-br-md"
                      : "bg-dash-bg text-dash-text border border-dash-border rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <>
                      <RichText text={msg.content} />
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.toolCalls.map((tc) => (
                            <ChatToolChip
                              key={tc.id}
                              name={tc.name}
                              status={tc.status}
                              input={tc.input}
                              preview={tc.preview}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {msg.content && (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      )}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className={`flex flex-wrap gap-1 ${msg.content ? "mt-2" : ""}`}>
                          {msg.attachments.map((a) => {
                            const isImg = a.mediaType.startsWith("image/");
                            const Icon = isImg ? ImageIcon : FileText;
                            const label = (
                              <>
                                <Icon className="w-3 h-3" />
                                <span className="max-w-[140px] truncate">{a.name}</span>
                                {a.url && (
                                  <span className="text-white/60 text-[9px] uppercase tracking-wide">
                                    Drive
                                  </span>
                                )}
                              </>
                            );
                            return a.url ? (
                              <a
                                key={a.id}
                                href={a.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-md px-2 py-1 text-[10px] transition-colors"
                                title={`${a.name} · ${formatBytes(a.size)} · Open in Drive`}
                              >
                                {label}
                              </a>
                            ) : (
                              <span
                                key={a.id}
                                className="inline-flex items-center gap-1.5 bg-white/15 rounded-md px-2 py-1 text-[10px]"
                                title={`${a.name} · ${formatBytes(a.size)}`}
                              >
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                  <p
                    className={`text-[9px] mt-1.5 ${
                      msg.role === "user"
                        ? "text-white/50"
                        : "text-dash-text-secondary"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-dash-bg border border-dash-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-dash-text-secondary">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-copper" />
                    <span className="text-xs">Thinking…</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-dash-border space-y-2">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attachments.map((a) => {
                  const isImg = a.mediaType.startsWith("image/");
                  return (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1.5 bg-dash-bg border border-dash-border rounded-lg pl-2 pr-1 py-1 text-[11px] text-dash-text"
                      title={`${a.name} · ${formatBytes(a.size)}`}
                    >
                      {isImg ? (
                        <ImageIcon className="w-3 h-3 text-brand-copper" />
                      ) : (
                        <FileText className="w-3 h-3 text-brand-copper" />
                      )}
                      <span className="max-w-[140px] truncate">{a.name}</span>
                      <span className="text-dash-text-secondary/60">
                        {formatBytes(a.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        className="w-4 h-4 flex items-center justify-center rounded hover:bg-dash-sidebar-hover cursor-pointer"
                        aria-label={`Remove ${a.name}`}
                      >
                        <X className="w-3 h-3 text-dash-text-secondary" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {attachError && (
              <p className="text-[11px] text-dash-warn">{attachError}</p>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || attachments.length >= MAX_ATTACHMENTS}
                title="Attach images or PDFs"
                aria-label="Attach files"
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-dash-border text-dash-text-secondary hover:bg-dash-bg hover:text-brand-copper disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input, attachments);
                  }
                }}
                placeholder="Ask anything about the dashboard…"
                className="flex-1 bg-dash-bg border border-dash-border rounded-xl px-3.5 py-2.5 text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
              />
              <button
                onClick={() => sendMessage(input, attachments)}
                disabled={(!input.trim() && attachments.length === 0) || loading}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-copper text-white hover:bg-brand-copper/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating trigger button — hidden when ActionFab is mounted */}
      {!hideOwnFab && (
        <button
          onClick={() => setOpen((v) => !v)}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer ${
            open
              ? "bg-dash-sidebar text-white hover:bg-dash-sidebar/90"
              : "bg-brand-copper text-white hover:bg-brand-copper/90 hover:scale-105"
          }`}
        >
          {open ? (
            <X className="w-5 h-5" />
          ) : (
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              <Sparkles className="absolute -top-1.5 -right-1.5 w-3 h-3 text-dash-warn" />
            </div>
          )}
        </button>
      )}
    </>
  );
}
