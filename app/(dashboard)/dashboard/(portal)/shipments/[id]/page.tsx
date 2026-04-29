"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Upload,
  ExternalLink,
  FileText,
  Truck,
  Building,
  Package,
  Shield,
} from "lucide-react";
import { TRAFICO_STATUS_CONFIG, getDocumentChecklist, type Trafico } from "@/app/lib/customs-data";
import type { HydratedTrafico } from "@/app/lib/trafico-hydrator";
import type { TraficoEvent } from "@/app/lib/trafico-events";

const formatMxn = (n: number | undefined) =>
  n === undefined ? "—" : `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} MXN`;

const formatUsd = (n: number | undefined) =>
  n === undefined ? "—" : `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} USD`;

const formatDate = (iso: string | undefined) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
};

const DOC_STATUS_ICON: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  uploaded: { icon: CheckCircle2, color: "text-dash-success" },
  "in-progress": { icon: Clock, color: "text-dash-warn" },
  missing: { icon: Circle, color: "text-dash-danger" },
  "not-applicable": { icon: Circle, color: "text-dash-text-secondary/40" },
};

// Doc keys that can actually be uploaded today (W6 limitation; mirrors
// the docs route's DOC_KEY_TO_COLUMN allow-list).
const UPLOADABLE_KEYS = new Set(["calculo", "brokerFactura", "expediente"]);

const ShipmentDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [hydrated, setHydrated] = useState<HydratedTrafico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDocKeyRef = useRef<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/dashboard/traficos/${encodeURIComponent(id)}/rich`, { cache: "no-store" });
      if (r.status === 404) {
        setError("Trafico not found");
        setHydrated(null);
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setHydrated(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const triggerUpload = (docKey: string) => {
    if (!UPLOADABLE_KEYS.has(docKey)) return;
    pendingDocKeyRef.current = docKey;
    fileInputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const docKey = pendingDocKeyRef.current;
    if (!file || !docKey) return;
    setUploadingKey(docKey);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("docKey", docKey);
      const r = await fetch(`/api/dashboard/shipments/${encodeURIComponent(id)}/docs`, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${r.status}`);
      }
      await load(); // refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingKey(null);
      pendingDocKeyRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand-copper animate-spin" />
      </div>
    );
  }

  if (error || !hydrated) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="bg-dash-danger/10 border border-dash-danger/30 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-dash-danger mx-auto mb-2" />
          <p className="text-dash-danger">{error || "Could not load shipment."}</p>
        </div>
      </div>
    );
  }

  const { trafico, events } = hydrated;
  const cfg = TRAFICO_STATUS_CONFIG[trafico.status];
  const checklist = getDocumentChecklist(trafico);
  const sortedEvents = [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFile}
      />

      <BackLink />

      {/* Header */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-dash-text-secondary">
              Tráfico
            </p>
            <h1 className="text-2xl font-bold text-dash-text mt-0.5">
              {trafico.traficoNumber || trafico.id}
            </h1>
            <p className="text-xs font-mono text-dash-text-secondary mt-1">{trafico.id}</p>
            {trafico.pedimentoNumber && (
              <p className="text-xs text-dash-text-secondary mt-0.5">
                Pedimento: <span className="font-mono">{trafico.pedimentoNumber}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
            >
              Step {cfg.step} · {cfg.label.en}
            </span>
            <Link
              href={`/dashboard/customs?trafico=${encodeURIComponent(trafico.id)}`}
              className="text-[11px] text-brand-copper hover:underline"
            >
              Open in Customs list →
            </Link>
          </div>
        </div>

        {/* Quick metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-dash-border">
          <Metric icon={Package} label="Items" value={String(trafico.items.length)} />
          <Metric icon={Building} label="Broker" value={trafico.brokerName || "—"} />
          <Metric icon={Truck} label="Warehouse" value={trafico.warehouseName || "—"} />
          <Metric
            icon={Shield}
            label="Total import cost"
            value={formatMxn(trafico.totalImportCost)}
            valueClass="text-brand-copper"
          />
        </div>
      </div>

      {/* Two-column: Items + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Items / Vendors */}
          <Section title="Vendors / Items" count={trafico.items.length}>
            {trafico.items.length === 0 ? (
              <p className="text-xs text-dash-text-secondary">No items linked to this Trafico yet.</p>
            ) : (
              <div className="divide-y divide-dash-border">
                {trafico.items.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <p className="text-sm font-medium text-dash-text">
                          {item.vendorName}
                          {item.dealId && (
                            <Link
                              href={`/dashboard/pipeline?deal=${encodeURIComponent(item.dealId)}`}
                              className="ml-2 text-[10px] text-brand-copper hover:underline"
                            >
                              {item.dealId}
                            </Link>
                          )}
                        </p>
                        <p className="text-[11px] text-dash-text-secondary">
                          Invoice {item.vendorInvoiceNumber} · {item.vendorInvoiceDate}
                        </p>
                      </div>
                      <span className="text-sm text-dash-text font-medium">
                        ${item.invoiceTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {item.countryOfOrigin && (
                        <Badge label={`Origin: ${item.countryOfOrigin}`} tone="neutral" />
                      )}
                      {item.usmcaStatus !== "not-applicable" && (
                        <Badge
                          label={`USMCA: ${item.usmcaStatus}`}
                          tone={item.usmcaStatus === "on-file" ? "good" : "warn"}
                        />
                      )}
                      {item.spanishManualsRequired && (
                        <Badge
                          label={`Manual: ${item.spanishManualsStatus}`}
                          tone={item.spanishManualsStatus === "on-file" ? "good" : "warn"}
                        />
                      )}
                    </div>
                    {item.products.length > 0 && (
                      <div className="text-[11px] text-dash-text-secondary space-y-0.5 mt-1.5">
                        {item.products.map((p, i) => (
                          <p key={i}>
                            {p.quantity}× <span className="font-mono text-dash-text">{p.sku}</span>{" "}
                            — {p.description} ({formatUsd(p.amount)})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Documents checklist */}
          <Section title="Document Checklist" count={checklist.filter(c => c.status === "uploaded").length} subCount={checklist.length}>
            <div className="space-y-1.5">
              {checklist.map((c) => {
                const cfg = DOC_STATUS_ICON[c.status];
                const Icon = cfg.icon;
                const canUpload = c.status === "missing" && UPLOADABLE_KEYS.has(c.key);
                return (
                  <div key={c.key} className="flex items-center justify-between py-1.5 border-b border-dash-border/50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                      <span className="text-sm text-dash-text truncate">{c.label.en}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.driveFileId && (
                        <a
                          href={`https://drive.google.com/file/d/${c.driveFileId}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-brand-copper hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {canUpload && (
                        <button
                          type="button"
                          onClick={() => triggerUpload(c.key)}
                          disabled={uploadingKey === c.key}
                          className="text-[11px] flex items-center gap-1 px-2 py-0.5 bg-brand-copper text-white rounded hover:bg-brand-copper/90 disabled:opacity-50 cursor-pointer"
                        >
                          {uploadingKey === c.key ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                          Upload
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-dash-text-secondary mt-2">
              Note (W6): only Cálculo, Broker Factura, and Expediente have upload columns
              today. Other doc types need a schema add — flagged for follow-up.
            </p>
          </Section>

          {/* Calculo breakdown */}
          {trafico.calculoBreakdown && (
            <Section title="Cálculo de Impuestos">
              <CalculoTable trafico={trafico} />
            </Section>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-1">
          <Section title="Timeline" count={sortedEvents.length}>
            {sortedEvents.length === 0 ? (
              <p className="text-xs text-dash-text-secondary">No events logged yet.</p>
            ) : (
              <ol className="space-y-3 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-dash-border">
                {sortedEvents.map((e) => (
                  <TimelineEvent key={e.event_id} event={e} />
                ))}
              </ol>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const BackLink = () => (
  <Link
    href="/dashboard/shipments"
    className="inline-flex items-center gap-1 text-xs text-dash-text-secondary hover:text-brand-copper transition-colors"
  >
    <ArrowLeft className="w-3 h-3" />
    All Shipments
  </Link>
);

const Section = ({
  title,
  count,
  subCount,
  children,
}: {
  title: string;
  count?: number;
  subCount?: number;
  children: React.ReactNode;
}) => (
  <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
    <h3 className="text-sm font-semibold text-dash-text mb-3">
      {title}
      {count !== undefined && (
        <span className="ml-2 text-xs text-dash-text-secondary font-normal">
          ({count}{subCount !== undefined ? `/${subCount}` : ""})
        </span>
      )}
    </h3>
    {children}
  </div>
);

const Metric = ({
  icon: Icon,
  label,
  value,
  valueClass = "",
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-dash-text-secondary flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {label}
    </p>
    <p className={`text-sm font-medium text-dash-text mt-0.5 ${valueClass}`}>{value}</p>
  </div>
);

const Badge = ({ label, tone }: { label: string; tone: "good" | "warn" | "neutral" }) => {
  const cls = {
    good: "bg-dash-success/10 text-dash-success",
    warn: "bg-dash-warn/10 text-dash-warn",
    neutral: "bg-dash-bg text-dash-text-secondary",
  }[tone];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>
      {label}
    </span>
  );
};

const TimelineEvent = ({ event }: { event: TraficoEvent }) => (
  <li className="pl-5 relative">
    <span className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-brand-copper/20 border-2 border-brand-copper" />
    <p className="text-[11px] text-dash-text-secondary">{formatDate(event.timestamp)} · {event.actor}</p>
    <p className="text-xs text-dash-text font-medium capitalize">
      {event.event_type.replace(/_/g, " ")}
      {event.from_status && event.to_status && (
        <>: <span className="text-dash-text-secondary">{event.from_status} → {event.to_status}</span></>
      )}
    </p>
    {event.message && <p className="text-[11px] text-dash-text-secondary mt-0.5">{event.message}</p>}
  </li>
);

const CalculoTable = ({ trafico }: { trafico: Trafico }) => {
  const calc = trafico.calculoBreakdown!;
  return (
    <div className="space-y-3 text-xs">
      <Subtotal label="Taxes (Cuadro de Contribuciones)" total={calc.taxSubtotal}>
        <Row label="IGI" value={calc.igi} />
        <Row label="DTA" value={calc.dta} />
        <Row label="IVA (16%)" value={calc.iva} />
      </Subtotal>
      <Subtotal label="Broker fees (Cuenta Mexicana)" total={calc.brokerSubtotal}>
        <Row label="Honorarios" value={calc.honorarios} />
        <Row label="Prevalidación" value={calc.prevalidacion} />
        <Row label="Sellos fiscales" value={calc.sellosFiscales} />
        <Row label="IVA Cuenta Mexicana" value={calc.ivaCuentaMexicana} />
      </Subtotal>
      <Subtotal label="Warehouse handling (Cuenta Americana)" total={calc.warehouseSubtotal}>
        <Row label="Revisión / clasificación" value={calc.revisionClasificacion} />
        <Row label="Carga / descarga" value={calc.cargaDescarga} />
      </Subtotal>
      <div className="border-t border-dash-border pt-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-dash-text">Total cálculo</span>
        <span className="text-sm font-semibold text-brand-copper">{formatMxn(trafico.calculoTotal)}</span>
      </div>
    </div>
  );
};

const Subtotal = ({ label, total, children }: { label: string; total: number; children: React.ReactNode }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">{label}</p>
    <div className="space-y-0.5 pl-2">
      {children}
      <div className="flex items-center justify-between border-t border-dash-border/50 pt-1 mt-1">
        <span className="text-dash-text-secondary">Subtotal</span>
        <span className="text-dash-text font-medium">{formatMxn(total)}</span>
      </div>
    </div>
  </div>
);

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between">
    <span className="text-dash-text-secondary">{label}</span>
    <span className="text-dash-text">{formatMxn(value)}</span>
  </div>
);

export default ShipmentDetailPage;
