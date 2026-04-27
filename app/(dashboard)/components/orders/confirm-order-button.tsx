"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useFeatures } from "@/app/lib/use-features";

interface ConfirmOrderButtonProps {
  orderId: number;
  orderName: string;
  /** Odoo state — only `draft` and `sent` are confirmable. */
  orderState: string;
}

const CONFIRMABLE_STATES = new Set(["draft", "sent"]);

const ConfirmOrderButton = ({
  orderId,
  orderName,
  orderState,
}: ConfirmOrderButtonProps) => {
  const router = useRouter();
  const features = useFeatures();
  const [submitting, setSubmitting] = useState(false);

  if (!features.ready || !features.has("create_invoice")) return null;
  if (!CONFIRMABLE_STATES.has(orderState)) return null;

  const handleConfirm = async () => {
    if (
      !confirm(
        `Confirm ${orderName} as a sale and generate the draft invoice in Odoo?`
      )
    ) {
      return;
    }
    setSubmitting(true);
    const r = await fetch("/api/dashboard/orders/confirm", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    setSubmitting(false);
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      toast.error(body.error || "Confirm failed");
      return;
    }
    const data = (await r.json()) as {
      invoiceIds: number[];
      invoiceNames: string[];
    };
    if (data.invoiceIds.length > 0) {
      toast.success(
        `Confirmed and invoiced as ${data.invoiceNames.join(", ")} (Odoo).`
      );
    } else {
      toast.success(`Confirmed in Odoo. Invoice generation will run on next sync.`);
    }
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleConfirm}
      disabled={submitting}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-brand-copper/40 bg-brand-copper/5 text-brand-copper rounded hover:bg-brand-copper/10 disabled:opacity-50 transition-colors cursor-pointer"
    >
      {submitting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5" />
      )}
      Confirm sale → invoice
    </button>
  );
};

export { ConfirmOrderButton };
