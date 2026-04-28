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
} from "lucide-react";
import { useFeatures } from "@/app/lib/use-features";

type ApprovalState =
  | "draft"
  | "prefactura_sent"
  | "approved"
  | "stamped";

interface ApprovalRecord {
  invoiceId: number;
  invoiceName: string;
  state: ApprovalState;
  prefacturaSentAt: string;
  prefacturaSentBy: string;
  prefacturaRecipient: string;
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

const StageRail = ({ state }: { state: ApprovalState }) => {
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
        label="Prefactura sent"
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
  const sendEnabled = canSend && state !== "stamped";
  const approveEnabled =
    canApprove && (state === "prefactura_sent" || state === "draft");
  // Attach is enabled when prefactura is approved, when CFDI is already
  // stamped (allow additional supplemental docs), OR when the actor is an
  // owner using the override path on draft/prefactura_sent.
  const attachEnabled =
    canAttach &&
    (state === "approved" ||
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

      <StageRail state={state} />

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
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-dash-border bg-white text-dash-text rounded hover:border-brand-copper transition-colors cursor-pointer"
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
  const [to, setTo] = useState(partnerEmail ?? "");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(
    `Prefactura ${invoiceName} para tu revisión`
  );
  const [body, setBody] = useState(
    `Hola ${partnerName},\n\nAdjunto la prefactura ${invoiceName} para tu revisión.\n\nPor favor confirma respondiendo a este correo si todo es correcto. Una vez aprobada, generaremos el CFDI / factura final.\n\nSi necesitas algún ajuste, avísame antes de que la timbremos — cancelar un CFDI ya timbrado es un proceso largo en el SAT.\n\nGracias,\nCounter Cultures`
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
      <Field label="To">
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="customer@example.com"
          className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
        />
      </Field>
      <Field label="CC (optional)">
        <input
          type="text"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          placeholder="finance@countercultures.com.mx"
          className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
        />
      </Field>
      <Field label="Subject">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
        />
      </Field>
      <Field label="Message">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
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
      <Field label="Approval method">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as typeof method)}
          className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
        >
          <option value="email_reply">Email reply (customer wrote back)</option>
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
          placeholder="Paste the customer's email reply, or any context for the audit trail."
          className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
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
        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900 space-y-2">
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
            <p className="text-amber-900/80">
              Only owners can override. Ask Roger to attach this one, or go
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
    <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
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
  <div className="px-5 py-4 border-t border-dash-border flex items-center justify-end gap-2 mt-auto sticky bottom-0 bg-white">
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
