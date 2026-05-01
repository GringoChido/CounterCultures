"use client";

/**
 * Generate-label panel — drops Roger into the Skydropx flow without
 * leaving the deal detail. Lives at the top of the Shipments tab when
 * the deal has at least one PO and the fulfillment plan is "ship".
 *
 * Minimal address + parcel form. Submitting POSTs to
 * /api/dashboard/deals/[id]/ship which:
 *   1. calls Skydropx (or returns a dry-run when SKYDROPX_API_KEY is
 *      unset)
 *   2. uploads the label PDF to Drive under Deals/[dealId]/Shipping/
 *   3. inserts a Shipments row with the tracking number + label id
 *
 * On success the panel surfaces the tracking number + carrier + a
 * link to the label PDF in Drive, and pulses a callback so the
 * pipeline page can refetch shipments for the deal.
 */

import { useState } from "react";
import { Loader2, Truck, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ShipPanelProps {
  dealId: string;
  defaultPoId?: string;
  defaultBrand?: string;
  defaultRecipient?: {
    name?: string;
    street1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
  };
  onShipped?: (info: {
    trackingNumber: string;
    trackingUrl: string;
    labelDriveLink: string | null;
    carrier: string;
    mode: "dry-run" | "live";
  }) => void;
}

export const SkydropxShipPanel = ({
  dealId,
  defaultPoId,
  defaultBrand,
  defaultRecipient,
  onShipped,
}: ShipPanelProps) => {
  const [poId, setPoId] = useState(defaultPoId ?? "");
  const [brand, setBrand] = useState(defaultBrand ?? "");
  const [name, setName] = useState(defaultRecipient?.name ?? "");
  const [street1, setStreet1] = useState(defaultRecipient?.street1 ?? "");
  const [city, setCity] = useState(defaultRecipient?.city ?? "");
  const [state, setState] = useState(defaultRecipient?.state ?? "");
  const [postalCode, setPostalCode] = useState(defaultRecipient?.postalCode ?? "");
  const [phone, setPhone] = useState(defaultRecipient?.phone ?? "");
  const [email, setEmail] = useState(defaultRecipient?.email ?? "");
  const [weightKg, setWeightKg] = useState("5");
  const [lengthCm, setLengthCm] = useState("40");
  const [widthCm, setWidthCm] = useState("30");
  const [heightCm, setHeightCm] = useState("20");
  const [contents, setContents] = useState("Architectural fixtures");
  const [submitting, setSubmitting] = useState(false);
  const [last, setLast] = useState<{
    trackingNumber: string;
    trackingUrl: string;
    labelDriveLink: string | null;
    carrier: string;
    mode: "dry-run" | "live";
    rateMxn: number;
  } | null>(null);

  const submit = async () => {
    if (!poId || !brand || !name || !street1 || !city || !state || !postalCode) {
      toast.error("Recipient name, address, and PO/brand are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/dashboard/deals/${encodeURIComponent(dealId)}/ship`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            poId,
            brand,
            to: {
              name,
              street1,
              city,
              state,
              postalCode,
              country: "MX",
              phone,
              email,
            },
            parcel: {
              weightKg: parseFloat(weightKg) || 1,
              lengthCm: parseFloat(lengthCm) || 30,
              widthCm: parseFloat(widthCm) || 20,
              heightCm: parseFloat(heightCm) || 15,
              contents,
            },
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        trackingNumber: string;
        trackingUrl: string;
        labelDriveLink: string | null;
        carrier: string;
        mode: "dry-run" | "live";
        rateMxn: number;
        warnings: string[];
      };
      setLast(data);
      toast.success(
        `Label ${data.mode === "dry-run" ? "(dry-run) " : ""}generated · ${data.carrier} · ${data.trackingNumber}`,
      );
      for (const w of data.warnings) toast.warning(w);
      onShipped?.({
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        labelDriveLink: data.labelDriveLink,
        carrier: data.carrier,
        mode: data.mode,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Skydropx call failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full text-[12px] bg-dash-surface border border-dash-border rounded-md px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper";
  const labelCls =
    "text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1 block";

  return (
    <div className="rounded-lg border border-brand-copper/30 bg-brand-copper/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-copper inline-flex items-center gap-2">
          <Truck className="w-3.5 h-3.5" />
          Generate Skydropx label
        </h4>
        {process.env.NEXT_PUBLIC_SKYDROPX_DRY_RUN === "true" && (
          <span className="text-[10px] uppercase tracking-wider text-dash-warn">
            dry-run
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>PO #</label>
          <input
            className={inputCls}
            value={poId}
            onChange={(e) => setPoId(e.target.value)}
            placeholder="PO-2026-0218"
          />
        </div>
        <div>
          <label className={labelCls}>Brand</label>
          <input
            className={inputCls}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="BLANCO"
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
          Recipient
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name"
          />
          <input
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+52 415 123 4567"
          />
          <input
            className={`${inputCls} col-span-2`}
            value={street1}
            onChange={(e) => setStreet1(e.target.value)}
            placeholder="Street address"
          />
          <input
            className={inputCls}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
          />
          <input
            className={inputCls}
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
          />
          <input
            className={inputCls}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="CP"
          />
          <input
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
          Parcel
        </p>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className={labelCls}>Weight kg</label>
            <input
              className={inputCls}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              type="number"
              step="0.1"
            />
          </div>
          <div>
            <label className={labelCls}>L cm</label>
            <input
              className={inputCls}
              value={lengthCm}
              onChange={(e) => setLengthCm(e.target.value)}
              type="number"
            />
          </div>
          <div>
            <label className={labelCls}>W cm</label>
            <input
              className={inputCls}
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              type="number"
            />
          </div>
          <div>
            <label className={labelCls}>H cm</label>
            <input
              className={inputCls}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              type="number"
            />
          </div>
        </div>
        <input
          className={`${inputCls} mt-2`}
          value={contents}
          onChange={(e) => setContents(e.target.value)}
          placeholder="Contents"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-dash-border">
        <p className="text-[10px] text-dash-text-secondary">
          Label saves to Deals/{dealId}/Shipping/. Tracking link is returned
          for sending to the customer on their source channel.
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-md bg-brand-copper text-white hover:bg-brand-copper/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Generate label"
          )}
        </button>
      </div>

      {last && (
        <div className="border border-dash-border bg-dash-surface rounded-md p-3 text-[12px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-dash-text-secondary">Tracking</span>
            <span className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
              {last.mode}
              {last.rateMxn > 0 ? ` · $${last.rateMxn.toLocaleString()} MXN` : ""}
            </span>
          </div>
          <p className="font-mono text-brand-copper">
            {last.carrier} · {last.trackingNumber}
          </p>
          <div className="flex gap-3 mt-1 text-[11px]">
            <a
              href={last.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-copper hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Tracking page
            </a>
            {last.labelDriveLink && (
              <a
                href={last.labelDriveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-copper hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Label PDF
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
