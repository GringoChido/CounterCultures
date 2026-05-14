"use client";

/**
 * Imports panel — the "where are the goods right now?" surface for one
 * deal. Combines the 12-stage tracker with slots for the four key
 * customs documents (commercial invoice, packing list, pedimento,
 * broker info). Lives in the deal detail's Customs tab and is also
 * surfaced as the body of /dashboard/imports/[deal-id].
 *
 * For PR-11 the docs slots render as Drive-link placeholders — the
 * actual upload flow comes later via a small extension to
 * /api/dashboard/deals/[id]/import-doc (TODO when Roger asks for it).
 */

import { TwelveStageTracker } from "./twelve-stage-tracker";
import { FileText } from "lucide-react";

interface ImportDoc {
  label: { en: string; es: string };
  driveFileId?: string;
  filename?: string;
}

export interface ImportsPanelData {
  dealId: string;
  currentStage: number;
  brokerName?: string;
  brokerEmail?: string;
  pedimentoNumber?: string;
  commercialInvoice?: ImportDoc;
  packingList?: ImportDoc;
  pedimento?: ImportDoc;
}

const DocSlot = ({ doc }: { doc: ImportDoc }) => {
  const hasFile = !!doc.driveFileId;
  return (
    <div
      className={`border rounded-md p-3 ${
        hasFile ? "border-brand-copper/30 bg-brand-copper/5" : "border-dash-border bg-dash-surface"
      }`}
    >
      <p className="text-[9px] uppercase tracking-wider text-dash-text-secondary">
        {doc.label.en}
      </p>
      {hasFile ? (
        <a
          href={`https://drive.google.com/file/d/${doc.driveFileId}/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-mono text-brand-copper hover:underline mt-1 inline-flex items-center gap-1"
        >
          <FileText className="w-3 h-3" />
          {doc.filename ?? "Open"}
        </a>
      ) : (
        <p className="text-[12px] text-dash-text-secondary/70 mt-1">
          Pending
        </p>
      )}
    </div>
  );
};

export const ImportsPanel = ({ data }: { data: ImportsPanelData }) => {
  return (
    <div className="rounded-lg border border-brand-copper/30 bg-brand-copper/5 p-4 space-y-4">
      <TwelveStageTracker current={data.currentStage} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DocSlot
          doc={
            data.commercialInvoice ?? {
              label: { en: "Commercial invoice", es: "Factura comercial" },
            }
          }
        />
        <DocSlot
          doc={
            data.packingList ?? {
              label: { en: "Packing list", es: "Lista de empaque" },
            }
          }
        />
        <DocSlot
          doc={
            data.pedimento ?? {
              label: { en: "Pedimento", es: "Pedimento" },
              filename: data.pedimentoNumber
                ? `PED-${data.pedimentoNumber}.pdf`
                : undefined,
            }
          }
        />
        <div className="border border-dash-border bg-dash-surface rounded-md p-3">
          <p className="text-[9px] uppercase tracking-wider text-dash-text-secondary">
            Broker
          </p>
          <p className="text-[12px] text-dash-text mt-1">
            {data.brokerName || "—"}
          </p>
          {data.brokerEmail && (
            <p className="text-[10px] text-dash-text-secondary truncate">
              {data.brokerEmail}
            </p>
          )}
        </div>
      </div>

      <p className="text-[10px] text-dash-text-secondary">
        Documents save to{" "}
        <span className="font-mono">
          Deals/{data.dealId}/Pedimentos &amp; Importación/
        </span>
      </p>
    </div>
  );
};
