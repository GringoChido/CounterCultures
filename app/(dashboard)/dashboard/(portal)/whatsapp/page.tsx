"use client";

import { useState, useEffect, useRef } from "react";
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
      `Hi ${name}, quick update on your order — your shipment has cleared customs and is on its way. ETA 3–5 business days.`,
  },
  {
    id: "thanks-review-en",
    label: "Thanks / review",
    text: (name) =>
      `Thank you ${name}! We'd love a short review if you have a moment — it really helps our artisans. Reply here and we'll take care of the rest.`,
  },
  {
    id: "spec-sheet-es",
    label: "Ficha técnica",
    text: (name) =>
      `Hola ${name}, aquí te comparto la ficha técnica completa. Si necesitas medidas específicas o acabados, me avisas.`,
  },
];

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  avatar: string;
  phone: string;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "contact";
  timestamp: Date;
  read: boolean;
}

const conversations: Conversation[] = [
  {
    id: "1",
    name: "Maria Rodriguez",
    lastMessage: "I'd love to see the copper basin collection in person",
    timestamp: new Date(2026, 2, 30, 14, 23),
    unread: 2,
    avatar: "MR",
    phone: "+52 415 123 4567",
  },
  {
    id: "2",
    name: "James Patterson",
    lastMessage: "Can you send the spec sheet for the farmhouse sink?",
    timestamp: new Date(2026, 2, 30, 11, 45),
    unread: 0,
    avatar: "JP",
    phone: "+1 512 555 0123",
  },
  {
    id: "3",
    name: "Sofia Gutierrez",
    lastMessage: "The trade program application is ready for review",
    timestamp: new Date(2026, 2, 29, 16, 30),
    unread: 1,
    avatar: "SG",
    phone: "+52 55 9876 5432",
  },
  {
    id: "4",
    name: "David Chen",
    lastMessage: "Thanks for the quote! We'll discuss and get back to you",
    timestamp: new Date(2026, 2, 29, 9, 15),
    unread: 0,
    avatar: "DC",
    phone: "+1 310 555 7890",
  },
  {
    id: "5",
    name: "Ana Morales",
    lastMessage: "The delivery was perfect, very happy with the pieces",
    timestamp: new Date(2026, 2, 28, 18, 0),
    unread: 0,
    avatar: "AM",
    phone: "+52 415 987 6543",
  },
];

const sampleMessages: Record<string, Message[]> = {
  "1": [
    { id: "m1", text: "Hi! I saw your copper basins on Instagram. They're beautiful!", sender: "contact", timestamp: new Date(2026, 2, 30, 13, 45), read: true },
    { id: "m2", text: "Thank you, Maria! Each piece is hand-hammered by artisans in Santa Clara del Cobre. Would you like to know more about any specific design?", sender: "user", timestamp: new Date(2026, 2, 30, 13, 50), read: true },
    { id: "m3", text: "Yes! The oval basin with the natural patina finish caught my eye. What sizes do you have?", sender: "contact", timestamp: new Date(2026, 2, 30, 14, 10), read: true },
    { id: "m4", text: "We have that in 16\", 18\", and 20\" widths. The 18\" is our most popular. I can send you the full spec sheet.", sender: "user", timestamp: new Date(2026, 2, 30, 14, 15), read: true },
    { id: "m5", text: "That would be great! Also, do you have a showroom I could visit?", sender: "contact", timestamp: new Date(2026, 2, 30, 14, 20), read: false },
    { id: "m6", text: "I'd love to see the copper basin collection in person", sender: "contact", timestamp: new Date(2026, 2, 30, 14, 23), read: false },
  ],
  "2": [
    { id: "m7", text: "Hi, I'm working on a kitchen remodel project. Do you carry farmhouse sinks?", sender: "contact", timestamp: new Date(2026, 2, 30, 10, 0), read: true },
    { id: "m8", text: "Absolutely! We have several copper farmhouse sinks. Are you looking for a specific size?", sender: "user", timestamp: new Date(2026, 2, 30, 10, 30), read: true },
    { id: "m9", text: "33\" single bowl would be ideal. My client loves the hammered copper look.", sender: "contact", timestamp: new Date(2026, 2, 30, 11, 0), read: true },
    { id: "m10", text: "Can you send the spec sheet for the farmhouse sink?", sender: "contact", timestamp: new Date(2026, 2, 30, 11, 45), read: true },
  ],
};

type OpenDeal = { id: string; customer: string; stage: string };

const WhatsAppPage = () => {
  const [selectedConversation, setSelectedConversation] = useState<string>("1");
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDeals, setOpenDeals] = useState<OpenDeal[]>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const { consumeInsert, pendingInsert, openCommandPalette } = useProductInsert();

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
          name: activeConversation.name,
          phone: activeConversation.phone,
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
      // Uses the existing /api/dashboard/activities endpoint — no new
      // backend required.
      const res = await fetch("/api/dashboard/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "whatsapp_attached",
          description: `WhatsApp conversation linked: ${activeConversation.phone} (${activeConversation.name}) — ${activeConversation.lastMessage}`,
          contactName: activeConversation.name,
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

  const applyTemplate = (tpl: QuickTemplate) => {
    if (!activeConversation) return;
    const firstName = activeConversation.name.split(" ")[0];
    setMessageInput(tpl.text(firstName));
  };

  useEffect(() => {
    if (pendingInsert && selectedConversation) {
      const inserted = consumeInsert();
      if (inserted) {
        const productUrl = `https://countercultures.mx/en/shop/${inserted.category}/p/${inserted.slug}`;
        const msg = `*${inserted.product}*\n${inserted.brand} | $${inserted.unitPrice.toLocaleString()} MXN\n${inserted.image ? inserted.image + "\n" : ""}View: ${productUrl}`;
        // Defer to next frame to satisfy react-hooks/set-state-in-effect
        requestAnimationFrame(() => setMessageInput(msg));
        toast.success(`Product ready to send: ${inserted.product}`);
      }
    }
  }, [pendingInsert, selectedConversation, consumeInsert]);

  const activeConversation = conversations.find((c) => c.id === selectedConversation);
  const messages = sampleMessages[selectedConversation] ?? [];

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full flex items-start gap-3 p-3 border-b border-dash-border hover:bg-dash-bg/50 transition-colors text-left cursor-pointer ${
                  selectedConversation === conv.id ? "bg-brand-copper/10" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-brand-copper/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-brand-copper">{conv.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-dash-text truncate">{conv.name}</p>
                    <span className="text-[10px] text-dash-text-secondary shrink-0 ml-2">
                      {format(conv.timestamp, "h:mm a")}
                    </span>
                  </div>
                  <p className="text-xs text-dash-text-secondary truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-brand-copper flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[10px] font-bold text-white">{conv.unread}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between p-4 border-b border-dash-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-copper/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-brand-copper">{activeConversation.avatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dash-text">{activeConversation.name}</p>
                    <p className="text-xs text-dash-text-secondary">{activeConversation.phone}</p>
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
                    <span>{creatingLead ? "Creating…" : "Create Lead"}</span>
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
                            Loading open deals…
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
                                    {d.customer || "—"} · {d.stage}
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
                    href={`tel:${activeConversation.phone.replace(/\s+/g, "")}`}
                    className="p-2 rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
                    title={`Call ${activeConversation.phone}`}
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
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                        msg.sender === "user"
                          ? "bg-brand-copper text-white rounded-br-sm"
                          : "bg-dash-surface border border-dash-border text-dash-text rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender === "user" ? "text-white/60" : "text-dash-text-secondary"}`}>
                        <span className="text-[10px]">{format(msg.timestamp, "h:mm a")}</span>
                        {msg.sender === "user" && (
                          msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 pt-3 pb-1 border-t border-dash-border flex flex-wrap gap-1.5">
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
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                  />
                  <button
                    type="button"
                    aria-label="Send message"
                    className="p-2.5 bg-brand-copper rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-dash-text-secondary/30 mx-auto mb-3" />
                <p className="text-sm text-dash-text-secondary">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPage;
