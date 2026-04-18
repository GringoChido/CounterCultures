"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  UserPlus,
  Briefcase,
  Search,
  CalendarClock,
  CalendarPlus,
  Target,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type QuickAction =
  | { kind: "navigate"; label: string; icon: LucideIcon; href: string }
  | { kind: "message"; label: string; icon: LucideIcon; prompt: string };

const QUICK_ACTIONS: QuickAction[] = [
  { kind: "navigate", label: "Add a new Lead", icon: UserPlus, href: "/dashboard/leads?action=new" },
  { kind: "navigate", label: "Create a Deal", icon: Briefcase, href: "/dashboard/pipeline?action=new" },
  { kind: "message", label: "Find a customer", icon: Search, prompt: "Help me find a customer. Ask me their name or company, then search leads, contacts, and deals." },
  { kind: "message", label: "Today's new leads", icon: CalendarClock, prompt: "Show me the new leads from the last 24 hours." },
  { kind: "navigate", label: "Schedule a showroom visit", icon: CalendarPlus, href: "/dashboard/leads?action=new&source=Showroom+Walk-in" },
  { kind: "message", label: "Check deal status", icon: Target, prompt: "I want to check the status of a deal — ask me for the deal name, customer, or ID." },
  { kind: "message", label: "This week's numbers", icon: BarChart3, prompt: "What are this week's pipeline value, revenue collected, new deals, and new leads?" },
];

const DEFAULT_NAME = "Roger";
const IDENTITY_KEY = "cc_portal_identity_name";
const DISMISSED_KEY = "cc_chat_dismissed_session";

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

export function AIChatWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState<string>(DEFAULT_NAME);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Load saved identity, auto-open on mount unless user dismissed this session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(IDENTITY_KEY);
      if (saved && saved.trim()) setName(saved.trim());
      const dismissed = sessionStorage.getItem(DISMISSED_KEY);
      if (!dismissed) setOpen(true);
    } catch {
      // storage not available — fall through
    }
  }, []);

  const persistName = (next: string) => {
    const clean = next.trim() || DEFAULT_NAME;
    setName(clean);
    try {
      localStorage.setItem(IDENTITY_KEY, clean);
    } catch {
      // ignore
    }
    setEditingName(false);
  };

  const closeWidget = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const apiMessages = [...messagesRef.current, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/dashboard-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });

        const data = await res.json();

        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            data.message || data.error || "Sorry, I couldn't process that.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: "Connection error. Please try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  const runAction = (action: QuickAction) => {
    if (action.kind === "navigate") {
      router.push(action.href);
      closeWidget();
    } else {
      sendMessage(action.prompt);
    }
  };

  const clearChat = () => {
    setMessages([]);
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
                  onClick={clearChat}
                  title="Clear chat"
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
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-semibold text-dash-text">
                      Hello {name},
                    </p>
                    {!editingName ? (
                      <button
                        onClick={() => {
                          setNameDraft(name);
                          setEditingName(true);
                        }}
                        title="Not you? Sign in as someone else"
                        className="text-[10px] text-dash-text-secondary/70 hover:text-brand-copper transition-colors cursor-pointer"
                      >
                        (not you?)
                      </button>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          persistName(nameDraft);
                        }}
                        className="flex items-center gap-1"
                      >
                        <input
                          autoFocus
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          onBlur={() => persistName(nameDraft)}
                          className="w-20 px-1.5 py-0.5 text-xs bg-dash-bg border border-dash-border rounded focus:outline-none focus:ring-1 focus:ring-brand-copper"
                          placeholder="Name"
                        />
                      </form>
                    )}
                  </div>
                  <p className="text-sm text-dash-text-secondary">
                    what can I help you with today?
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary px-1">
                    Quick actions
                  </p>
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => runAction(a)}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs text-dash-text bg-dash-bg rounded-lg border border-dash-border hover:border-brand-copper/40 hover:bg-brand-copper/5 transition-colors cursor-pointer"
                    >
                      <a.icon className="w-3.5 h-3.5 text-brand-copper/70 shrink-0" />
                      {a.label}
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
                    <RichText text={msg.content} />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
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
          <div className="p-3 border-t border-dash-border">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask anything about the dashboard…"
                className="flex-1 bg-dash-bg border border-dash-border rounded-xl px-3.5 py-2.5 text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-copper/30"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-copper text-white hover:bg-brand-copper/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating trigger button */}
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
            <Sparkles className="absolute -top-1.5 -right-1.5 w-3 h-3 text-yellow-300" />
          </div>
        )}
      </button>
    </>
  );
}
