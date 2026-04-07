"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Minimize2,
  Maximize2,
  Database,
  FolderSearch,
  Package,
  FileText,
  Trash2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  { text: "Show me all leads", icon: Database },
  { text: "Search products by brand", icon: Package },
  { text: "What's in the Drive?", icon: FolderSearch },
  { text: "Show me a price list summary", icon: FileText },
];

// Minimal markdown renderer for assistant messages
function RichText({ text }: { text: string }) {
  // Process the text into segments
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        // Bold headers (** **)
        const processed = line.replace(
          /\*\*(.+?)\*\*/g,
          '<strong class="font-semibold text-dash-text">$1</strong>'
        );

        // Bullet points
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-1.5 pl-1">
              <span className="text-brand-copper mt-0.5 shrink-0">•</span>
              <span
                dangerouslySetInnerHTML={{
                  __html: processed.replace(/^[-•]\s*/, ""),
                }}
              />
            </div>
          );
        }

        // Links — turn Google Drive / Sheets URLs into clickable links
        const withLinks = processed.replace(
          /(https:\/\/(?:docs\.google\.com|drive\.google\.com)[^\s)]+)/g,
          '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-brand-copper underline underline-offset-2 hover:text-brand-copper/80">Open in Google →</a>'
        );

        // Empty lines become spacing
        if (line.trim() === "") {
          return <div key={i} className="h-1" />;
        }

        return (
          <p
            key={i}
            className="leading-relaxed"
            dangerouslySetInnerHTML={{ __html: withLinks }}
          />
        );
      })}
    </div>
  );
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

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
        const apiMessages = [...messages, userMsg].map((m) => ({
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
    [messages, loading]
  );

  const clearChat = () => {
    setMessages([]);
  };

  const widthClass = expanded ? "w-[500px] max-w-[calc(100vw-2rem)]" : "w-[380px] max-w-[calc(100vw-2rem)]";
  const heightClass = expanded ? "h-[600px] max-h-[calc(100dvh-6rem)]" : "h-[480px] max-h-[calc(100dvh-6rem)]";

  return (
    <>
      {/* Chat Window */}
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
                <p className="text-sm font-semibold">CRM Assistant</p>
                <p className="text-[10px] text-white/50">
                  Connected to Drive &amp; Sheets
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
                onClick={() => setOpen(false)}
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
                <div className="text-center py-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-brand-copper/20 to-brand-terracotta/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-brand-copper" />
                  </div>
                  <p className="text-sm font-medium text-dash-text">
                    Hi! I&apos;m your CRM Assistant.
                  </p>
                  <p className="text-xs text-dash-text-secondary mt-1 max-w-[280px] mx-auto">
                    I can search products, pull up leads, browse Drive files,
                    create folders, and more — all from right here.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary">
                    Try asking
                  </p>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.text}
                      onClick={() => sendMessage(s.text)}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-xs text-dash-text bg-dash-bg rounded-lg border border-dash-border hover:border-brand-copper/30 hover:bg-brand-copper/5 transition-colors cursor-pointer"
                    >
                      <s.icon className="w-3.5 h-3.5 text-brand-copper/60 shrink-0" />
                      {s.text}
                    </button>
                  ))}
                </div>
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
                    <span className="text-xs">
                      Querying CRM...
                    </span>
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
                placeholder="Search products, pull leads, browse Drive..."
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
        onClick={() => setOpen(!open)}
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
