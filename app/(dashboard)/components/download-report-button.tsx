"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DownloadReportButtonProps {
  reportName: string;
  recordId: string | number;
  fileName?: string;
  label?: string;
}

const DownloadReportButton = ({
  reportName,
  recordId,
  fileName,
  label = "PDF",
}: DownloadReportButtonProps) => {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        report: reportName,
        id: String(recordId),
      });
      const res = await fetch(`/api/dashboard/odoo-report?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `${reportName}-${recordId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        `Download failed: ${err instanceof Error ? err.message : "unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dash-border bg-dash-surface rounded hover:border-brand-copper hover:text-brand-copper disabled:opacity-50 transition-colors cursor-pointer text-dash-text-secondary"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      {label}
    </button>
  );
};

export { DownloadReportButton };
