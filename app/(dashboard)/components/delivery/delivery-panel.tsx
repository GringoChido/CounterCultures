"use client";

/**
 * Delivery panel — combines Miguel's local scheduler and the
 * signature-capture flow into a single surface. Roger's spec:
 *
 *   - For fulfillment=local: scheduling panel (window picker + phone-
 *     call confirm) and on-site signature capture
 *   - For fulfillment=pickup: only the signature is captured at the
 *     warehouse counter at moment of release
 *
 * The hard rule "no goods leave without a captured signature" is
 * enforced by disabling the "Mark delivered" CTA until the canvas
 * has ink and a signer name has been entered.
 */

import { useRef, useState } from "react";
import { Loader2, Phone, Calendar, Eraser, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  SignatureCanvas,
  type SignatureCanvasHandle,
} from "./signature-canvas";

interface DeliveryPanelProps {
  dealId: string;
  fulfillmentMode: "local" | "pickup";
  contactName: string;
  deliveryAddress?: string;
  itemsSummary?: string;
  initial?: {
    windowStart?: string;
    windowEnd?: string;
    phoneConfirmedAt?: string;
    signatureDriveFileId?: string;
    signedAt?: string;
    signedBy?: string;
  };
  onUpdated: (patch: {
    deliveryWindowStart?: string;
    deliveryWindowEnd?: string;
    deliveryPhoneConfirmedAt?: string;
    deliverySignatureDriveFileId?: string;
    deliverySignedAt?: string;
    deliverySignedBy?: string;
  }) => void;
}

const isoFromLocal = (local: string): string => {
  if (!local) return "";
  // Treat a datetime-local input as local-zone, convert to ISO for storage
  const d = new Date(local);
  return Number.isFinite(d.getTime()) ? d.toISOString() : "";
};

const localFromIso = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  // datetime-local format: YYYY-MM-DDTHH:MM
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const DeliveryPanel = ({
  dealId,
  fulfillmentMode,
  contactName,
  deliveryAddress,
  itemsSummary,
  initial,
  onUpdated,
}: DeliveryPanelProps) => {
  const [windowStart, setWindowStart] = useState(
    localFromIso(initial?.windowStart),
  );
  const [windowEnd, setWindowEnd] = useState(localFromIso(initial?.windowEnd));
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const [signedBy, setSignedBy] = useState(initial?.signedBy ?? contactName);
  const [canvasEmpty, setCanvasEmpty] = useState(true);
  const sigRef = useRef<SignatureCanvasHandle>(null);

  const phoneConfirmedAt = initial?.phoneConfirmedAt;
  const signedFileId = initial?.signatureDriveFileId;

  const saveSchedule = async (
    opts: { phoneConfirmed?: boolean } = {},
  ) => {
    setSavingSchedule(true);
    try {
      const res = await fetch(
        `/api/dashboard/deals/${encodeURIComponent(dealId)}/delivery`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "schedule",
            windowStart: windowStart ? isoFromLocal(windowStart) : "",
            windowEnd: windowEnd ? isoFromLocal(windowEnd) : "",
            phoneConfirmed: !!opts.phoneConfirmed,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      onUpdated({
        deliveryWindowStart: data.delivery_window_start ?? undefined,
        deliveryWindowEnd: data.delivery_window_end ?? undefined,
        deliveryPhoneConfirmedAt:
          data.delivery_phone_confirmed_at ?? undefined,
      });
      toast.success(
        opts.phoneConfirmed
          ? "Phone-confirm noted on the deal"
          : "Delivery window saved",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingSchedule(false);
    }
  };

  const captureSignature = async () => {
    if (!signedBy.trim()) {
      toast.error("Recipient name is required");
      return;
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Capture a signature first");
      return;
    }
    setSavingSignature(true);
    try {
      const dataUrl = sigRef.current.toPngDataUrl();
      const res = await fetch(
        `/api/dashboard/deals/${encodeURIComponent(dealId)}/delivery`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sign",
            signaturePngBase64: dataUrl,
            signedBy: signedBy.trim(),
            deliveryAddress,
            itemsSummary,
            fulfillmentMode,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        driveFileId: string;
        driveWebViewLink: string | null;
        signedAt: string;
        signedBy: string;
      };
      onUpdated({
        deliverySignatureDriveFileId: data.driveFileId,
        deliverySignedAt: data.signedAt,
        deliverySignedBy: data.signedBy,
      });
      toast.success("Signed receipt saved to Drive · delivered");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save signature");
    } finally {
      setSavingSignature(false);
    }
  };

  const labelCls =
    "text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1 block";
  const inputCls =
    "w-full text-[12px] bg-dash-surface border border-dash-border rounded-md px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper";

  return (
    <div className="space-y-4">
      {/* Scheduling — local mode only */}
      {fulfillmentMode === "local" && (
        <div className="rounded-lg border border-brand-copper/30 bg-brand-copper/5 p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-copper inline-flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Schedule with Miguel
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Window start</label>
              <input
                type="datetime-local"
                value={windowStart}
                onChange={(e) => setWindowStart(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Window end</label>
              <input
                type="datetime-local"
                value={windowEnd}
                onChange={(e) => setWindowEnd(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-dash-text-secondary">
              {phoneConfirmedAt
                ? `Phone-confirmed ${new Date(phoneConfirmedAt).toLocaleString()}`
                : "Phone-confirm with the customer once Miguel agrees the window."}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => saveSchedule()}
                disabled={savingSchedule}
                className="text-xs px-3 py-1.5 rounded-md border border-dash-border bg-dash-surface hover:bg-dash-bg transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingSchedule ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Save window"
                )}
              </button>
              <button
                type="button"
                onClick={() => saveSchedule({ phoneConfirmed: true })}
                disabled={savingSchedule}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-brand-copper text-white hover:bg-brand-copper/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Phone className="w-3.5 h-3.5" />
                Mark phone-confirmed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature capture */}
      <div className="rounded-lg border border-brand-copper/30 bg-brand-copper/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-copper inline-flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            Capture signature
          </h4>
          <span className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
            {fulfillmentMode === "pickup"
              ? "Warehouse counter"
              : "Customer doorstep"}
          </span>
        </div>

        {signedFileId ? (
          <div className="border border-dash-border bg-dash-surface rounded-md p-3 text-[12px]">
            <p className="text-dash-text">
              ✓ Receipt signed by{" "}
              <span className="font-medium">{initial?.signedBy ?? "—"}</span>
              {initial?.signedAt
                ? ` on ${new Date(initial.signedAt).toLocaleString()}`
                : ""}
            </p>
            <a
              href={`https://drive.google.com/file/d/${signedFileId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-copper hover:underline text-[11px]"
            >
              Open signed receipt in Drive →
            </a>
          </div>
        ) : (
          <>
            <div>
              <label className={labelCls}>Recipient name</label>
              <input
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                className={inputCls}
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className={labelCls}>Signature</label>
              <SignatureCanvas
                ref={sigRef}
                width={480}
                height={160}
                onChange={(empty) => setCanvasEmpty(empty)}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-dash-text-secondary">
                No goods leave without a captured signature.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => sigRef.current?.clear()}
                  disabled={savingSignature || canvasEmpty}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-dash-border bg-dash-surface hover:bg-dash-bg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={captureSignature}
                  disabled={savingSignature || canvasEmpty || !signedBy.trim()}
                  className="text-xs px-3 py-1.5 rounded-md bg-brand-copper text-white hover:bg-brand-copper/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingSignature ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Save signed receipt"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
