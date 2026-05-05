"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
  MessageCircle,
  Send,
  Phone,
  MoreVertical,
  Search,
  Check,
  CheckCheck,
  Package,
  UserPlus,
  Link2,
  ChevronDown,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useProductInsert } from "@/app/(dashboard)/components/product-insert-context";

// V3: bilingual quick-reply templates. Tapping a template drops its text
// into the compose field. Placeholders {{name}} are filled from the
// active conversation.
type QuickTemplate = { id: string; label: string; text: (name: string) => string };
const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: "deposit-reminder-es",
    label: "Recordatorio depósito",
    text: (name) =>
      `Hola ${name}, un recordatorio amistoso sobre el depósito del 50% para iniciar tu pedido. ¿Te gustaría que te enviemos el enlace de pago?`,
  },
  {
    id: "shipping-update-en",
    label: "Shipping update",
    text: (name) =>
      `Hi ${name}, quick update on your order, your shipment has cleared customs and is on its way. ETA 3 to 5 business days.`,
  },
  {
    id: "thanks-review-en",
    label: "Thanks / review",
    text: (name) =>
      `Thank you ${name}! We'd love a short review if you have a moment, it really helps our artisans. Reply here and we'll take care of the rest.`,
  },
  {
    id: "spec-sheet-es",
    label: "Ficha técnica",
    text: (name) =>
      `Hola ${name}, aquí te comparto la ficha técnica completa. Si necesitas medidas específicas o acabados, me avisas.`,
  },
];

interface Conversation {
  waId: string;
  contactName: string;
  lastMessage: string;
  lastTimestamp: string;
  lastDirection: string;
  unreadCount: number;
  totalCount: number;
  linkedLeadId: string;
}

interface Message {
  message_id: string;
  wa_id: string;
  contact_name: string;
  direction: string;
  type: string;
  body: string;
  media_id: string;
  status: string;
  template_name: string;
  phone_number_id: string;
  created_at: string;
  updated_at: string;
  linked_lead_id: string;
  error: string;
}

type OpenDeal = { id: string; customer: string; stage: string };

const formatPhone = (waId: string): string =>
  waId.startsWith("+") ? waId : `+${waId}`;

const initialsFor = (name: string, waId: string): string => {
  const trimmed = name.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return waId.slice(-2);
};

const safeDate = (iso: string): Date => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

const WhatsAppPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedWaId, setSelectedWaId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [outboundEnabled, setOutboundEnabled] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDeals, setOpenDeals] = useState<OpenDeal[]>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const { consumeInsert, pendingInsert, openCommandPalette } = useProductInsert();

  const activeConversation = useMemo(
    () => conversations.find((c) => c.waId === selectedWaId) ?? null,
    [conversations, selectedWaId]
  );

  const filteredConversations = useMemo(
    () =>
      conversations.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          c.contactName.toLowerCase().includes(q) ||
          c.waId.toLowerCase().includes(q)
        );
      }),
    [conversations, searchQuery]
  );

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/whatsapp/conversations");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        conversations: Conversation[];
        outboundEnabled: boolean;
      };
      setConversations(data.conversations);
      setOutboundEnabled(data.outboundEnabled);
      setConversationsLoading(false);
      // Default selection: most recent unread, else most recent overall.
      if (!selectedWaId && data.conversations.length > 0) {
        const firstUnread = data.conversations.find((c) => c.unreadCount > 0);
        setSelectedWaId(firstUnread?.waId ?? data.conversations[0].waId);
      }
    } catch (err) {
      console.error("[WhatsApp] load conversations failed:", err);
      setConversationsLoading(false);
    }
  }, [selectedWaId]);

  const loadThread = useCallback(async (waId: string) => {
    setThreadLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard/whatsapp/conversations/${encodeURIComponent(waId)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { messages: Message[] };
      setMessages(data.messages);
    } catch (err) {
      console.error("[WhatsApp] load thread failed:", err);
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const markRead = useCallback(async (waId: string) => {
    try {
      await fetch(
        `/api/dashboard/whatsapp/conversations/${encodeURIComponent(waId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark_read" }),
        }
      );
      setConversations((prev) =>
        prev.map((c) => (c.waId === waId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error("[WhatsApp] mark read failed:", err);
    }
  }, []);

  // Initial load on mount.
  useEffect(() => {
    void loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the user picks a conversation, fetch its thread and clear unread.
  useEffect(() => {
    if (!selectedWaId) {
      setMessages([]);
      return;
    }
    void loadThread(selectedWaId);
    const conv = conversations.find((c) => c.waId === selectedWaId);
    if (conv && conv.unreadCount > 0) {
      void markRead(selectedWaId);
    }
  }, [selectedWaId, conversations, loadThread, markRead]);

  // Poll the active thread + conversation list every 30s while the page
  // is visible. No sockets at this stage; Roger's volume is well under
  // the API rate ceiling.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void loadConversations();
      if (selectedWaId) void loadThread(selectedWaId);
    };
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [selectedWaId, loadConversations, loadThread]);

  // Auto-scroll to the latest message whenever the thread changes.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSendProduct = () => {
    openCommandPalette();
  };

  // Close the attach-to-deal dropdown on outside click.
  useEffect(() => {
    if (!attachMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [attachMenuOpen]);

  // Lazy-load open deals once when the user first opens the attach menu.
  const loadOpenDealsIfNeeded = async () => {
    if (openDeals.length > 0 || dealsLoading) return;
    setDealsLoading(true);
    try {
      const res = await fetch("/api/dashboard/pipeline");
      if (res.ok) {
        const data = (await res.json()) as {
          deals?: { id: string; customer_name?: string; stage?: string }[];
        };
        const deals = (data.deals ?? [])
          .filter((d) => d.stage && !/complete|lost/i.test(d.stage))
          .slice(0, 25)
          .map((d) => ({
            id: d.id,
            customer: d.customer_name ?? "",
            stage: d.stage ?? "",
          }));
        setOpenDeals(deals);
      }
    } catch (err) {
      console.error("[WhatsApp] load deals failed:", err);
    } finally {
      setDealsLoading(false);
    }
  };

  const handleCreateLead = async () => {
    if (!activeConversation || creatingLead) return;
    setCreatingLead(true);
    try {
      const res = await fetch("/api/dashboard/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeConversation.contactName,
          phone: formatPhone(activeConversation.waId),
          email: "",
          source: "whatsapp",
          status: "new",
          contact_type: "prospect",
          interest: activeConversation.lastMessage,
          value: "",
          next_followup: "",
          last_contact_date: new Date().toISOString().slice(0, 10),
          brand_slugs: "",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { id: string };
      toast.success(`Lead created: ${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setCreatingLead(false);
    }
  };

  const handleAttachToDeal = async (dealId: string) => {
    if (!activeConversation || attaching) return;
    setAttaching(true);
    try {
      // Log as an Activity_Log row so the deal history surfaces the link.
      // Uses the existing /api/dashboard/activities endpoint, no new
      // backend required.
      const res = await fetch("/api/dashboard/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "whatsapp_attached",
          description: `WhatsApp conversation linked: ${formatPhone(activeConversation.waId)} (${activeConversation.contactName}), ${activeConversation.lastMessage}`,
          contactName: activeConversation.contactName,
          dealId,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`Conversation linked to ${dealId}`);
      setAttachMenuOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to attach");
    } finally {
      setAttaching(false);
    }
  };

  const handleSend = async () => {
    const trimmed = messageInput.trim();
    if (!activeConversation || !trimmed || sending || !outboundEnabled) return;
    setSending(true);

    // Optimistic append: render the message immediately with a pending
    // status so it can't be re-typed. The server response replaces the
    // optimistic row with the real one (carrying Meta's wamid).
    const optimisticId = `optimistic-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const optimistic: Message = {
      message_id: optimisticId,
      wa_id: activeConversation.waId,
      contact_name: "",
      direction: "outbound",
      type: "text",
      body: trimmed,
      media_id: "",
      status: "pending",
      template_name: "",
      phone_number_id: "",
      created_at: nowIso,
      updated_at: nowIso,
      linked_lead_id: "",
      error: "",
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessageInput("");

    try {
      const res = await fetch("/api/dashboard/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toWaId: activeConversation.waId, body: trimmed }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { message: Message };
      setMessages((prev) =>
        prev.map((m) => (m.message_id === optimisticId ? data.message : m))
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.message_id === optimisticId
            ? {
                ...m,
                status: "failed",
                error: err instanceof Error ? err.message : String(err),
              }
            : m
        )
      );
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (tpl: QuickTemplate) => {
    if (!activeConversation) return;
    const firstName =
      activeConversation.contactName.split(" ")[0] ||
      formatPhone(activeConversation.waId);
    setMessageInput(tpl.text(firstName));
  };

  useEffect(() => {
    if (pendingInsert && selectedWaId) {
      const inserted = consumeInsert();
      if (inserted) {
        const productUrl = `https://countercultures.mx/en/shop/${inserted.category}/p/${inserted.slug}`;
        const msg = `*${inserted.product}*\n${inserted.brand} | $${inserted.unitPrice.toLocaleString()} MXN\n${inserted.image ? inserted.image + "\n" : ""}View: ${productUrl}`;
        // Defer to next frame to satisfy react-hooks/set-state-in-effect
        requestAnimationFrame(() => setMessageInput(msg));
        toast.success(`Product ready to send: ${inserted.product}`);
      }
    }
  }, [pendingInsert, selectedWaId, consumeInsert]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">WhatsApp Inbox</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Manage customer conversations</p>
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border overflow-hidden flex h-[calc(100vh-220px)] min-h-[500px]">
        <div className="w-80 border-r border-dash-border flex flex-col shrink-0">
          <div className="p-3 border-b border-dash-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dash-text-secondary" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <p className="px-3 py-4 text-xs text-dash-text-muted">Loading conversations...</p>
            ) : filteredConversations.length === 0 ? (
              <p className="px-3 py-4 text-xs text-dash-text-muted">
                {conversations.length === 0
                  ? "No conversations yet."
                  : "No conversations match your search."}
              </p>
            ) : (
              filteredConversations.map((conv) => {
                const initials = initialsFor(conv.contactName, conv.waId);
                const displayName = conv.contactName || formatPhone(conv.waId);
                return (
                  <button
                    key={conv.waId}
                    onClick={() => setSelectedWaId(conv.waId)}
                    className={`w-full flex items-start gap-3 p-3 border-b border-dash-border hover:bg-dash-bg/50 transition-colors text-left cursor-pointer ${
                      selectedWaId === conv.waId ? "bg-brand-copper/10" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-copper/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-brand-copper">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-dash-text truncate">{displayName}</p>
                        <span className="text-[10px] text-dash-text-secondary shrink-0 ml-2">
                          {format(safeDate(conv.lastTimestamp), "h:mm a")}
                        </span>
                      </div>
                      <p className="text-xs text-dash-text-secondary truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-brand-copper flex items-center justify-center shrink-0 mt-1">
                        <span className="text-[10px] font-bold text-white">{conv.unreadCount}</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between p-4 border-b border-dash-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-copper/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-brand-copper">
                      {initialsFor(activeConversation.contactName, activeConversation.waId)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dash-text">
                      {activeConversation.contactName || formatPhone(activeConversation.waId)}
                    </p>
                    <p className="text-xs text-dash-text-secondary">
                      {formatPhone(activeConversation.waId)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateLead}
                    disabled={creatingLead}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-dash-border hover:border-brand-copper hover:text-brand-copper transition-colors cursor-pointer disabled:opacity-50 text-dash-text-secondary"
                    title="Create Lead from this conversation"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{creatingLead ? "Creating..." : "Create Lead"}</span>
                  </button>

                  <div className="relative" ref={attachMenuRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachMenuOpen((v) => !v);
                        loadOpenDealsIfNeeded();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-dash-border hover:border-brand-copper hover:text-brand-copper transition-colors cursor-pointer text-dash-text-secondary"
                      aria-haspopup="listbox"
                      aria-expanded={attachMenuOpen}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Attach to Deal</span>
                      <ChevronDown
                        className={`w-3 h-3 transition ${attachMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {attachMenuOpen ? (
                      <div className="absolute right-0 mt-1 w-72 max-h-80 overflow-auto bg-dash-surface border border-dash-border rounded-lg shadow-lg z-50 py-1">
                        {dealsLoading ? (
                          <p className="px-3 py-2 text-xs text-dash-text-muted">
                            Loading open deals...
                          </p>
                        ) : openDeals.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-dash-text-muted">
                            No open deals found.
                          </p>
                        ) : (
                          <ul role="listbox">
                            {openDeals.map((d) => (
                              <li key={d.id}>
                                <button
                                  type="button"
                                  onClick={() => handleAttachToDeal(d.id)}
                                  disabled={attaching}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-dash-bg transition flex flex-col gap-0.5"
                                >
                                  <span className="font-medium text-dash-text">{d.id}</span>
                                  <span className="text-dash-text-secondary truncate">
                                    {d.customer || "..."} · {d.stage}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <a
                    href={`tel:${formatPhone(activeConversation.waId).replace(/\s+/g, "")}`}
                    className="p-2 rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
                    title={`Call ${formatPhone(activeConversation.waId)}`}
                  >
                    <Phone className="w-4 h-4 text-dash-text-secondary" />
                  </a>
                  <button
                    type="button"
                    aria-label="More options"
                    className="p-2 rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4 text-dash-text-secondary" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-dash-bg/30">
                {threadLoading && messages.length === 0 ? (
                  <p className="text-xs text-dash-text-muted">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-dash-text-muted">No messages in this conversation yet.</p>
                ) : (
                  <>
                  {messages.map((msg) => {
                    const isOutbound = msg.direction === "outbound";
                    const showRead = isOutbound && msg.status === "read";
                    const showDelivered =
                      isOutbound && (msg.status === "delivered" || msg.status === "read");
                    const showFailed = isOutbound && msg.status === "failed";
                    const isPending = isOutbound && msg.status === "pending";
                    return (
                      <div
                        key={msg.message_id}
                        className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                            isOutbound
                              ? "bg-brand-copper text-white rounded-br-sm"
                              : "bg-dash-surface border border-dash-border text-dash-text rounded-bl-sm"
                          } ${isPending ? "opacity-60" : ""}`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 ${isOutbound ? "text-white/60" : "text-dash-text-secondary"}`}>
                            <span className="text-[10px]">{format(safeDate(msg.created_at), "h:mm a")}</span>
                            {isOutbound && (
                              isPending ? (
                                <span className="text-[10px]">Sending...</span>
                              ) : showFailed ? (
                                <span title={msg.error || "send failed"} className="text-[10px] font-semibold">!</span>
                              ) : showRead || showDelivered ? (
                                <CheckCheck className={`w-3 h-3 ${showRead ? "text-white" : ""}`} />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {!outboundEnabled && (
                <div className="px-4 pt-2 pb-1 border-t border-dash-border bg-dash-warn/10">
                  <p className="text-[11px] text-dash-warn inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    Outbound disabled until WHATSAPP_API_TOKEN is configured.
                  </p>
                </div>
              )}

              <div className={`px-4 pt-3 pb-1 ${outboundEnabled ? "border-t border-dash-border" : ""} flex flex-wrap gap-1.5`}>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-dash-text-muted mr-1">
                  <Sparkles className="w-3 h-3" />
                  Templates
                </span>
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="text-[11px] px-2 py-1 rounded-full border border-dash-border bg-dash-surface hover:border-brand-copper hover:text-brand-copper transition text-dash-text-secondary"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>

              <div className="px-4 pt-2 pb-4">
                {messageInput.length > 4000 && (
                  <p className="text-[11px] text-dash-warn mb-1.5 inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    {messageInput.length} / 4096 characters. Long messages may need a template.
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendProduct}
                    className="p-2.5 rounded-lg border border-dash-border hover:bg-dash-bg hover:text-brand-copper transition-colors cursor-pointer text-dash-text-secondary"
                    title="Send Product"
                    aria-label="Send Product"
                  >
                    <Package className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    placeholder={outboundEnabled ? "Type a message..." : "Outbound disabled"}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    disabled={!outboundEnabled}
                    className="flex-1 px-4 py-2.5 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper disabled:opacity-50"
                  />
                  <button
                    type="button"
                    aria-label="Send message"
                    onClick={handleSend}
                    disabled={!outboundEnabled || sending || messageInput.trim().length === 0}
                    className="p-2.5 bg-brand-copper rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <MessageCircle className="w-12 h-12 text-dash-text-secondary/30 mx-auto mb-3" />
                {conversationsLoading ? (
                  <p className="text-sm text-dash-text-secondary">Loading conversations...</p>
                ) : conversations.length === 0 ? (
                  <>
                    <p className="text-sm text-dash-text-secondary">
                      No conversations yet. Inbound messages from your WhatsApp Business number will land here.
                    </p>
                    {!outboundEnabled && (
                      <p className="text-xs text-dash-warn mt-3 inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        Outbound disabled until WHATSAPP_API_TOKEN is configured.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-dash-text-secondary">Select a conversation to start messaging</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPage;
