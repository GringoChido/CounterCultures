"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileText,
  Send,
  CheckCircle2,
  Paperclip,
  Loader2,
  X,
  Download,
  AlertTriangle,
  ShieldCheck,
  Users,
  Globe,
  ExternalLink,
  MessageSquare,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useFeatures } from "@/app/lib/use-features";

type ApprovalState =
  | "draft"
  | "prefactura_sent"
  | "approved"
  | "stamped";

type FacturaType = "personalized" | "general_public";

interface ApprovalRecord {
  invoiceId: number;
  invoiceName: string;
  state: ApprovalState;
  facturaType: FacturaType;
  prefacturaSentAt: string;
  prefacturaSentBy: string;
  prefacturaRecipient: string;
  prefacturaThreadId: string;
  approvedAt: string;
  approvedBy: string;
  approvalMethod: string;
  approvalNote: string;
  stampedAt: string;
  updatedAt: string;
}

interface AttachmentRow {
  id: number;
  name: string;
  mimetype: string;
  fileSize: number;
  createDate: string;
  createdBy: string;
}

interface InvoiceWorkflowPanelProps {
  invoiceId: number;
  invoiceName: string;
  partnerName: string;
  partnerEmail?: string;
}

const fmtDate = (iso: string) => (iso ? iso.slice(0, 10) : "");

const StageBadge = ({
  active,
  done,
  label,
  icon: Icon,
}: {
  active: boolean;
  done: boolean;
  label: string;
  icon: typeof FileText;
}) => (
  <div
    className={`flex flex-col items-center gap-1.5 ${
      done
        ? "text-brand-sage"
        : active
          ? "text-brand-copper"
          : "text-dash-text-muted"
    }`}
  >
    <div
      className={`w-7 h-7 rounded-full border flex items-center justify-center ${
        done
          ? "bg-brand-sage/10 border-brand-sage"
          : active
            ? "bg-brand-copper/10 border-brand-copper"
            : "bg-dash-bg-muted border-dash-border"
      }`}
    >
      {done ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : (
        <Icon className="w-3.5 h-3.5" />
      )}
    </div>
    <div className="text-[10px] uppercase tracking-wider font-medium">
      {label}
    </div>
  </div>
);

const StageRail = ({
  state,
  facturaType,
}: {
  state: ApprovalState;
  facturaType: FacturaType;
}) => {
  // General public facturas skip the prefactura → approval middle steps
  // entirely (Público en general — no review needed). Just draft → stamped.
  if (facturaType === "general_public") {
    const isStamped = state === "stamped";
    return (
      <div className="flex items-center justify-between gap-2 mb-4">
        <StageBadge active={!isStamped} done={isStamped} label="Draft" icon={FileText} />
        <div className={`flex-1 h-px ${isStamped ? "bg-brand-sage" : "bg-dash-border"}`} />
        <StageBadge active={isStamped} done={isStamped} label="Stamped" icon={Paperclip} />
      </div>
    );
  }
  const order: ApprovalState[] = ["draft", "prefactura_sent", "approved", "stamped"];
  const idx = order.indexOf(state);
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <StageBadge
        active={idx === 0}
        done={idx > 0}
        label="Draft"
        icon={FileText}
      />
      <div className={`flex-1 h-px ${idx > 0 ? "bg-brand-sage" : "bg-dash-border"}`} />
      <StageBadge
        active={idx === 1}
        done={idx > 1}
        label="Prefactura → Javier"
        icon={Send}
      />
      <div className={`flex-1 h-px ${idx > 1 ? "bg-brand-sage" : "bg-dash-border"}`} />
      <StageBadge
        active={idx === 2}
        done={idx > 2}
        label="Approved"
        icon={ShieldCheck}
      />
      <div className={`flex-1 h-px ${idx > 2 ? "bg-brand-sage" : "bg-dash-border"}`} />
      <StageBadge
        active={idx === 3}
        done={idx === 3}
        label="Stamped"
        icon={Paperclip}
      />
    </div>
  );
};

const InvoiceWorkflowPanel = ({
  invoiceId,
  invoiceName,
  partnerName,
  partnerEmail,
}: InvoiceWorkflowPanelProps) => {
  const router = useRouter();
  const features = useFeatures();
  const [approval, setApproval] = useState<ApprovalRecord | null>(null);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPrefactura, setShowPrefactura] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, fRes] = await Promise.all([
        fetch(`/api/dashboard/invoices/${invoiceId}/approval`, { credentials: "include" }),
        fetch(`/api/dashboard/invoices/${invoiceId}/cfdi`, { credentials: "include" }),
      ]);
      if (aRes.ok) {
        const data = (await aRes.json()) as { approval: ApprovalRecord };
        setApproval(data.approval);
      }
      if (fRes.ok) {
        const data = (await fRes.json()) as { attachments: AttachmentRow[] };
        setAttachments(data.attachments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (!features.ready) return null;
  // Hide entire panel if user can't see invoices at all (defensive — they
  // shouldn't reach this page anyway).
  if (!features.has("view_invoices")) return null;

  const canSend = features.has("send_prefactura");
  const canApprove = features.has("approve_prefactura");
  const canAttach = features.has("attach_cfdi");
  const isOwner = features.role === "owner";

  const state = approval?.state ?? "draft";
  const facturaType = approval?.facturaType ?? "personalized";
  const isGeneralPublic = facturaType === "general_public";

  // For general_public facturas there's no internal review — Finance
  // stamps directly. So Send/Approve are hidden; Attach is always enabled.
  const sendEnabled = canSend && !isGeneralPublic && state !== "stamped";
  const approveEnabled =
    canApprove &&
    !isGeneralPublic &&
    (state === "prefactura_sent" || state === "draft");
  // Attach is enabled when:
  //   - factura type = general_public (skip approval path entirely)
  //   - state = approved (personalized path completed approval)
  //   - state = stamped (allow additional supplemental docs)
  //   - actor is owner doing override on draft/prefactura_sent
  const attachEnabled =
    canAttach &&
    (isGeneralPublic ||
      state === "approved" ||
      state === "stamped" ||
      (isOwner && (state === "draft" || state === "prefactura_sent")));

  return (
    <section className="bg-dash-surface border border-dash-border rounded p-5 mb-6">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            CFDI workflow
          </h2>
          <p className="text-xs text-dash-text-secondary mt-1">
            Prefactura → client approval → stamp. Each stage is gated so
            nothing gets stamped before the customer signs off.
          </p>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-dash-text-muted" />}
      </div>

      <StageRail state={state} facturaType={facturaType} />

      {/* Factura type chooser — only shown when state is still "draft" so
          changing type after the workflow has started is intentional. */}
      {state === "draft" && canSend && (
        <FacturaTypeChooser
          invoiceId={invoiceId}
          currentType={facturaType}
          onChange={loadAll}
        />
      )}

      {/* General-public marker, shown after the type is set */}
      {state !== "draft" && isGeneralPublic && (
        <div className="bg-dash-info-soft border border-dash-info rounded p-3 mb-4 text-xs text-dash-info flex items-start gap-2">
          <Globe className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Público en general</div>
            <p className="mt-0.5 text-dash-info/80">
              No internal approval needed. Stamp directly in Solución
              Factible, then attach the XML + PDF here.
            </p>
          </div>
        </div>
      )}

      {/* History panel — what's happened so far */}
      {approval && (state !== "draft" || attachments.length > 0) && (
        <div className="bg-dash-bg-muted/40 rounded p-3 mb-4 text-xs space-y-1.5">
          {approval.prefacturaSentAt && (
            <div className="flex justify-between gap-2">
              <span className="text-dash-text-secondary">Prefactura sent</span>
              <span className="text-dash-text">
                {fmtDate(approval.prefacturaSentAt)} by {approval.prefacturaSentBy}
                {approval.prefacturaRecipient && (
                  <span className="text-dash-text-secondary">
                    {" "}
                    → {approval.prefacturaRecipient}
                  </span>
                )}
              </span>
            </div>
          )}
          {approval.prefacturaThreadId && (
            <PrefacturaThreadView
              invoiceId={invoiceId}
              threadId={approval.prefacturaThreadId}
              canApprove={approveEnabled}
              onMarkApproved={() => setShowApprove(true)}
            />
          )}
          {approval.approvedAt && (
            <div className="flex justify-between gap-2">
              <span className="text-dash-text-secondary">Customer approved</span>
              <span className="text-dash-text">
                {fmtDate(approval.approvedAt)} ·{" "}
                <span className="text-brand-sage">
                  {approval.approvalMethod || "—"}
                </span>{" "}
                by {approval.approvedBy}
              </span>
            </div>
          )}
          {approval.approvalNote && (
            <div className="text-dash-text-secondary border-l-2 border-dash-border pl-2 italic">
              "{approval.approvalNote}"
            </div>
          )}
          {approval.stampedAt && (
            <div className="flex justify-between gap-2">
              <span className="text-dash-text-secondary">Stamped CFDI attached</span>
              <span className="text-dash-text">{fmtDate(approval.stampedAt)}</span>
            </div>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {sendEnabled && (
          <button
            type="button"
            onClick={() => setShowPrefactura(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-dash-border bg-dash-surface text-dash-text rounded hover:border-brand-copper transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {state === "prefactura_sent" ? "Re-send prefactura" : "Send prefactura"}
          </button>
        )}
        {approveEnabled && (
          <button
            type="button"
            onClick={() => setShowApprove(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-brand-sage/40 bg-brand-sage/5 text-brand-sage rounded hover:bg-brand-sage/10 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Mark approved
          </button>
        )}
        {attachEnabled && (
          <button
            type="button"
            onClick={() => setShowAttach(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-brand-copper/40 bg-brand-copper/5 text-brand-copper rounded hover:bg-brand-copper/10 transition-colors cursor-pointer"
          >
            <Paperclip className="w-3.5 h-3.5" />
            {state === "stamped" ? "Attach more files" : "Attach CFDI"}
            {!isOwner && state !== "approved" && state !== "stamped" && (
              <span className="text-[10px] opacity-70">(after approval)</span>
            )}
          </button>
        )}
        {!attachEnabled &&
          canAttach &&
          (state === "draft" || state === "prefactura_sent") && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-dash-text-muted">
              <AlertTriangle className="w-3 h-3" />
              CFDI attach unlocks after approval
            </span>
          )}
      </div>

      {/* Attached files list */}
      {attachments.length > 0 && (
        <div>
          <h3 className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-2">
            Attached files ({attachments.length})
          </h3>
          <ul className="space-y-1">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-dash-bg-muted/40 transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5 text-dash-text-secondary shrink-0" />
                <a
                  href={`/api/dashboard/invoices/${invoiceId}/cfdi/${a.id}`}
                  className="flex-1 text-xs text-dash-text hover:text-dash-accent line-clamp-1 min-w-0"
                  title={a.name}
                >
                  {a.name}
                </a>
                <span className="text-[10px] text-dash-text-muted shrink-0">
                  {fmtDate(a.createDate)}
                </span>
                <span className="text-[10px] text-dash-text-muted shrink-0">
                  {(a.fileSize / 1024).toFixed(0)}KB
                </span>
                <a
                  href={`/api/dashboard/invoices/${invoiceId}/cfdi/${a.id}`}
                  className="text-dash-text-secondary hover:text-dash-text shrink-0"
                  download={a.name}
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modals */}
      {showPrefactura && (
        <SendPrefacturaModal
          invoiceId={invoiceId}
          invoiceName={invoiceName}
          partnerName={partnerName}
          partnerEmail={partnerEmail}
          onClose={() => setShowPrefactura(false)}
          onDone={() => {
            setShowPrefactura(false);
            loadAll();
            router.refresh();
          }}
        />
      )}
      {showApprove && (
        <MarkApprovedModal
          invoiceId={invoiceId}
          invoiceName={invoiceName}
          onClose={() => setShowApprove(false)}
          onDone={() => {
            setShowApprove(false);
            loadAll();
            router.refresh();
          }}
        />
      )}
      {showAttach && (
        <AttachCFDIModal
          invoiceId={invoiceId}
          invoiceName={invoiceName}
          isOwner={isOwner}
          requireOverride={state !== "approved"}
          onClose={() => setShowAttach(false)}
          onDone={() => {
            setShowAttach(false);
            loadAll();
            router.refresh();
          }}
        />
      )}
    </section>
  );
};

// ── Factura type chooser ──────────────────────────────────────────

const FacturaTypeChooser = ({
  invoiceId,
  currentType,
  onChange,
}: {
  invoiceId: number;
  currentType: FacturaType;
  onChange: () => void;
}) => {
  const [submitting, setSubmitting] = useState<FacturaType | null>(null);

  const set = async (type: FacturaType) => {
    if (type === currentType) return;
    setSubmitting(type);
    const r = await fetch(
      `/api/dashboard/invoices/${invoiceId}/approval/factura-type`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      }
    );
    setSubmitting(null);
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      toast.error(data.error || "Couldn't update factura type");
      return;
    }
    onChange();
  };

  return (
    <div className="mb-4">
      <p className="text-[11px] uppercase tracking-wider text-dash-text-secondary mb-2">
        Choose factura type
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => set("personalized")}
          disabled={submitting !== null}
          className={`flex items-start gap-3 p-3 border rounded text-left transition-colors cursor-pointer ${
            currentType === "personalized"
              ? "border-brand-copper bg-brand-copper/5"
              : "border-dash-border hover:border-brand-copper/50"
          }`}
        >
          {submitting === "personalized" ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
          ) : (
            <Users className="w-4 h-4 shrink-0 mt-0.5 text-brand-copper" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-dash-text">
              Personalized
            </div>
            <p className="text-[11px] text-dash-text-secondary mt-0.5 leading-snug">
              Customer requested factura with their RFC. Send prefactura to
              Javier (or whoever requested it) for internal approval before
              stamping.
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => set("general_public")}
          disabled={submitting !== null}
          className={`flex items-start gap-3 p-3 border rounded text-left transition-colors cursor-pointer ${
            currentType === "general_public"
              ? "border-dash-info bg-dash-info-soft/40"
              : "border-dash-border hover:border-dash-info/50"
          }`}
        >
          {submitting === "general_public" ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
          ) : (
            <Globe className="w-4 h-4 shrink-0 mt-0.5 text-dash-info" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-dash-text">
              Público en general
            </div>
            <p className="text-[11px] text-dash-text-secondary mt-0.5 leading-snug">
              No personalized RFC. Skip the approval step — stamp directly
              in Solución Factible and attach the XML + PDF here.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

// ── Inline prefactura thread view ─────────────────────────────────

interface ThreadMessage {
  messageId: string;
  from: string;
  fromEmail: string;
  date: string;
  snippet: string;
  body: string;
  unread: boolean;
}

interface ThreadResponse {
  accessible: boolean;
  reason?: string;
  threadId: string;
  subject?: string;
  messages: ThreadMessage[];
}

const fmtAgo = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  if (Number.isNaN(ms) || ms < 0) return iso.slice(0, 16);
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return iso.slice(0, 10);
};

const PrefacturaThreadView = ({
  invoiceId,
  threadId,
  canApprove,
  onMarkApproved,
}: {
  invoiceId: number;
  threadId: string;
  canApprove: boolean;
  onMarkApproved: () => void;
}) => {
  const [data, setData] = useState<ThreadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/dashboard/invoices/${invoiceId}/approval/thread`,
        { credentials: "include" }
      );
      if (r.ok) {
        const json = (await r.json()) as ThreadResponse;
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    load();
  }, [load]);

  const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${threadId}`;

  // Not accessible to current user — show fallback link.
  if (data && !data.accessible) {
    return (
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-dash-border/50 mt-1.5">
        <span className="text-dash-text-secondary inline-flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3" />
          Prefactura email thread
        </span>
        <a
          href={gmailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-dash-accent hover:underline"
          title={
            data.reason === "gmail_not_connected"
              ? "Connect your Gmail in Settings to read this thread inline"
              : "This thread isn't in your inbox — click to open in Gmail"
          }
        >
          Open in Gmail
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  // Loading initial fetch.
  if (!data) {
    return (
      <div className="flex items-center gap-2 text-dash-text-secondary text-[11px] pt-1.5 border-t border-dash-border/50 mt-1.5">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading email thread…
      </div>
    );
  }

  // Accessible — show inline.
  const messages = data.messages;
  const latest = messages[messages.length - 1];
  const incoming = messages.filter((m) => !isLikelySelf(m.fromEmail)).length;

  return (
    <div className="pt-2 mt-2 border-t border-dash-border/50">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 text-left flex items-center gap-2 text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px] uppercase tracking-wider">
            Prefactura thread
          </span>
          <span className="text-[11px] text-dash-text">
            · {messages.length} message{messages.length === 1 ? "" : "s"}
            {incoming > 0 && (
              <span className="text-brand-sage font-medium"> · {incoming} reply</span>
            )}
          </span>
          <ChevronDown
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          title="Refresh thread"
          className="text-dash-text-muted hover:text-dash-text transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Latest reply preview — always visible if it's from someone else */}
      {!expanded && latest && !isLikelySelf(latest.fromEmail) && (
        <div className="mt-2 p-2 bg-brand-sage/5 border border-brand-sage/20 rounded text-xs">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-dash-text">{latest.from}</span>
            <span className="text-dash-text-muted text-[10px]">
              {fmtAgo(latest.date)}
            </span>
          </div>
          <p className="text-dash-text-secondary line-clamp-2">{latest.snippet}</p>
          {canApprove && looksApproved(latest.body || latest.snippet) && (
            <button
              type="button"
              onClick={onMarkApproved}
              className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-brand-sage/40 bg-dash-surface text-brand-sage rounded hover:bg-brand-sage/10 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3" />
              Looks approved — log it
            </button>
          )}
        </div>
      )}

      {/* Full message list when expanded */}
      {expanded && (
        <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
          {messages.map((m) => {
            const self = isLikelySelf(m.fromEmail);
            return (
              <div
                key={m.messageId}
                className={`p-2 rounded text-xs ${
                  self
                    ? "bg-dash-bg-muted/40 border border-dash-border/50"
                    : "bg-brand-sage/5 border border-brand-sage/20"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-dash-text">
                    {self ? "You" : m.from}
                  </span>
                  <span className="text-dash-text-muted text-[10px]">
                    {fmtAgo(m.date)}
                  </span>
                </div>
                <p className="text-dash-text-secondary whitespace-pre-wrap line-clamp-6">
                  {m.body || m.snippet}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex items-center justify-end">
        <a
          href={gmailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-dash-text-muted hover:text-dash-text"
        >
          Open full thread in Gmail
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

// Heuristic: messages from a CC team email are "self." Better-than-nothing
// signal — same-domain reply detection. The full body comparison would
// need the actual logged-in user's email which we don't pass here, so
// domain match is the pragmatic proxy.
const isLikelySelf = (email: string): boolean => {
  const e = email.toLowerCase();
  return (
    e.endsWith("@countercultures.com.mx") || e.endsWith("@untold.works")
  );
};

// Heuristic for the "Looks approved — log it" suggestion. Conservative —
// only triggers on clear positive signals. False negatives are fine
// (Roger just clicks Mark Approved manually). False positives are not
// (would auto-suggest approving a vague "ok let me check" reply).
const looksApproved = (text: string): boolean => {
  const t = text.toLowerCase();
  const positive = [
    "aprobado",
    "aprobada",
    "approved",
    "looks good",
    "todo bien",
    "está bien",
    "esta bien",
    "perfecto",
    "perfect",
    "adelante",
    "proceed",
    "go ahead",
    "ok proceder",
    "okay proceder",
    "confirmo",
    "confirmed",
    "👍",
    "✅",
  ];
  const negative = [
    "no apruebo",
    "no es correcto",
    "incorrecto",
    "error",
    "no está bien",
    "ajustar",
    "cambiar",
    "espera",
    "wait",
    "let me check",
    "déjame revisar",
    "dejame revisar",
  ];
  if (negative.some((n) => t.includes(n))) return false;
  return positive.some((p) => t.includes(p));
};

// ── Modal: Send Prefactura ────────────────────────────────────────

const SendPrefacturaModal = ({
  invoiceId,
  invoiceName,
  partnerName,
  partnerEmail,
  onClose,
  onDone,
}: {
  invoiceId: number;
  invoiceName: string;
  partnerName: string;
  partnerEmail?: string;
  onClose: () => void;
  onDone: () => void;
}) => {
  // The recipient is the INTERNAL reviewer (Javier or whoever requested
  // the factura), not the end customer. Default-blank so the user fills
  // it in consciously; partnerEmail is shown as a hint but not pre-filled
  // (using it as the default would default-send-to-customer which is wrong).
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(
    `Prefactura ${invoiceName} — revisar antes de timbrar`
  );
  const [body, setBody] = useState(
    `Hola,\n\nAdjunto la prefactura ${invoiceName} para ${partnerName}.\n\nPor favor revisa que los datos estén correctos (RFC, conceptos, importes, uso CFDI) y responde confirmando si todo está bien — una vez aprobada timbramos en Solución Factible.\n\nSi hay algún ajuste, avísame antes de que la timbremos. Cancelar un CFDI ya timbrado en el SAT es un proceso largo.\n\nGracias`
  );
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!to || !file) {
      toast.error("Recipient + prefactura PDF required");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("to", to);
    if (cc.trim()) fd.append("cc", cc.trim());
    fd.append("subject", subject);
    fd.append("body", body);
    fd.append("file", file);
    const r = await fetch(
      `/api/dashboard/invoices/${invoiceId}/approval/send-prefactura`,
      { method: "POST", credentials: "include", body: fd }
    );
    setSubmitting(false);
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      if (r.status === 409 || data.error === "Gmail not connected") {
        toast.error("Connect your Gmail in Settings, then try again.");
      } else {
        toast.error(data.error || "Send failed");
      }
      return;
    }
    toast.success(`Prefactura sent to ${to}`);
    onDone();
  };

  return (
    <ModalShell title={`Send prefactura · ${invoiceName}`} onClose={onClose} disabled={submitting}>
      <div className="bg-dash-warn-soft border border-dash-warn rounded p-3 text-xs text-dash-warn">
        <div className="font-medium">Internal review, not customer-facing</div>
        <p className="mt-0.5 text-dash-warn/80">
          Send the prefactura to <strong>Javier</strong> (or whoever
          requested this factura on the customer's behalf). They confirm by
          email; then come back here to "Mark approved" and stamp.
          {partnerEmail && (
            <>
              {" "}
              Customer's email on file:{" "}
              <span className="font-mono">{partnerEmail}</span> — not the
              right recipient here.
            </>
          )}
        </p>
      </div>
      <Field label="Send to (internal reviewer)">
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="javier@countercultures.com.mx"
          className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
        />
      </Field>
      <Field label="CC (optional)">
        <input
          type="text"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          placeholder="finance@countercultures.com.mx"
          className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
        />
      </Field>
      <Field label="Subject">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
        />
      </Field>
      <Field label="Message">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
        />
      </Field>
      <Field label="Prefactura PDF">
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-dash-text"
        />
        {file && (
          <p className="text-[11px] text-dash-text-secondary mt-1">
            {file.name} · {(file.size / 1024).toFixed(0)}KB
          </p>
        )}
      </Field>
      <ModalFooter
        onClose={onClose}
        onSubmit={submit}
        submitting={submitting}
        submitLabel="Send via my Gmail"
        submitDisabled={!to || !file}
        submitIcon={<Send className="w-4 h-4" />}
      />
    </ModalShell>
  );
};

// ── Modal: Mark Approved ──────────────────────────────────────────

const MarkApprovedModal = ({
  invoiceId,
  invoiceName,
  onClose,
  onDone,
}: {
  invoiceId: number;
  invoiceName: string;
  onClose: () => void;
  onDone: () => void;
}) => {
  const [method, setMethod] = useState<
    "email_reply" | "signature" | "verbal" | "in_person" | "other"
  >("email_reply");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const r = await fetch(
      `/api/dashboard/invoices/${invoiceId}/approval/mark-approved`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, note: note.trim() || undefined }),
      }
    );
    setSubmitting(false);
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      toast.error(data.error || "Approval failed");
      return;
    }
    toast.success(`Prefactura for ${invoiceName} marked approved`);
    onDone();
  };

  return (
    <ModalShell title={`Mark approved · ${invoiceName}`} onClose={onClose} disabled={submitting}>
      <div className="bg-dash-bg-muted/50 rounded p-3 text-xs text-dash-text-secondary">
        Approval comes from the <strong>internal reviewer</strong> (Javier
        or whoever requested the factura). Logging here means they
        confirmed the prefactura is correct; the next step is stamping in
        Solución Factible.
      </div>
      <Field label="How did they confirm?">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as typeof method)}
          className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
        >
          <option value="email_reply">Email reply (Javier wrote back "approved" / "ok")</option>
          <option value="signature">Signature (signed copy)</option>
          <option value="verbal">Verbal / phone</option>
          <option value="in_person">In person</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Note (optional)">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Paste Javier's email reply, or any context — kept on the audit trail next to the timestamp."
          className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
        />
      </Field>
      <p className="text-[11px] text-dash-text-muted">
        Approval is logged with your name + timestamp. Once marked approved,
        the CFDI attach action unlocks.
      </p>
      <ModalFooter
        onClose={onClose}
        onSubmit={submit}
        submitting={submitting}
        submitLabel="Mark approved"
        submitDisabled={false}
        submitIcon={<ShieldCheck className="w-4 h-4" />}
      />
    </ModalShell>
  );
};

// ── Modal: Attach CFDI ───────────────────────────────────────────

const AttachCFDIModal = ({
  invoiceId,
  invoiceName,
  isOwner,
  requireOverride,
  onClose,
  onDone,
}: {
  invoiceId: number;
  invoiceName: string;
  isOwner: boolean;
  requireOverride: boolean;
  onClose: () => void;
  onDone: () => void;
}) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [override, setOverride] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!files || files.length === 0) {
      toast.error("Pick at least one file (XML and/or PDF)");
      return;
    }
    if (requireOverride && !override) {
      toast.error("Override checkbox required since prefactura isn't approved.");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("file", f));
    if (override) fd.append("override", "true");
    const r = await fetch(`/api/dashboard/invoices/${invoiceId}/cfdi`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    setSubmitting(false);
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      toast.error(data.message || data.error || "Attach failed");
      return;
    }
    toast.success(`CFDI attached to ${invoiceName}`);
    onDone();
  };

  return (
    <ModalShell title={`Attach CFDI · ${invoiceName}`} onClose={onClose} disabled={submitting}>
      <Field label="Files (XML + PDF)">
        <input
          type="file"
          multiple
          accept="application/xml,text/xml,.xml,application/pdf,.pdf"
          onChange={(e) => setFiles(e.target.files)}
          className="text-sm text-dash-text"
        />
        {files && files.length > 0 && (
          <ul className="text-[11px] text-dash-text-secondary mt-1 space-y-0.5">
            {Array.from(files).map((f) => (
              <li key={f.name}>
                {f.name} · {(f.size / 1024).toFixed(0)}KB
              </li>
            ))}
          </ul>
        )}
      </Field>
      <p className="text-[11px] text-dash-text-muted">
        Files upload to Odoo (so your accountant sees them) AND to the
        team's Drive folder. The USB step disappears.
      </p>
      {requireOverride && (
        <div className="bg-dash-warn-soft border border-dash-warn rounded p-3 text-xs text-dash-warn space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Approval not logged</div>
              <p className="mt-0.5">
                The prefactura for this invoice isn't marked approved. Best
                practice is to confirm approval first — but as an owner you
                can override. The override is logged.
              </p>
            </div>
          </div>
          {isOwner ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={override}
                onChange={(e) => setOverride(e.target.checked)}
              />
              <span>I confirm approval was received outside the system. Attach anyway.</span>
            </label>
          ) : (
            <p className="text-dash-warn/80">
              Only owners can override. Ask an owner to attach this one, or go
              back and "Mark approved" first.
            </p>
          )}
        </div>
      )}
      <ModalFooter
        onClose={onClose}
        onSubmit={submit}
        submitting={submitting}
        submitLabel="Upload"
        submitDisabled={
          !files ||
          files.length === 0 ||
          (requireOverride && !override) ||
          (requireOverride && !isOwner)
        }
        submitIcon={<Paperclip className="w-4 h-4" />}
      />
    </ModalShell>
  );
};

// ── Shared modal primitives ───────────────────────────────────────

const ModalShell = ({
  title,
  onClose,
  disabled,
  children,
}: {
  title: string;
  onClose: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
    onClick={(e) => {
      if (e.target === e.currentTarget && !disabled) onClose();
    }}
  >
    <div className="w-full max-w-xl bg-dash-surface rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
      <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
        <h2 className="font-display text-lg font-light text-dash-text">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={disabled}
          className="p-1 rounded hover:bg-dash-bg-muted transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-dash-text-secondary" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">{children}</div>
    </div>
  </div>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const ModalFooter = ({
  onClose,
  onSubmit,
  submitting,
  submitLabel,
  submitDisabled,
  submitIcon,
}: {
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
  submitDisabled: boolean;
  submitIcon: React.ReactNode;
}) => (
  <div className="px-5 py-4 border-t border-dash-border flex items-center justify-end gap-2 mt-auto sticky bottom-0 bg-dash-surface">
    <button
      type="button"
      onClick={onClose}
      disabled={submitting}
      className="px-3 py-1.5 text-sm text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
    >
      Cancel
    </button>
    <button
      type="button"
      onClick={onSubmit}
      disabled={submitting || submitDisabled}
      className="flex items-center gap-2 px-4 py-1.5 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
    >
      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : submitIcon}
      {submitLabel}
    </button>
  </div>
);

export { InvoiceWorkflowPanel };
