"use client";

/**
 * Quick-Capture ⚡ — floating header button for 10-second lead capture.
 *
 * Covers six inbound channels: walk-in, phone, WhatsApp, Email, Meta IG,
 * Meta FB. Source is recorded canonically (matches LEAD_SOURCES) so the
 * downstream send/routing logic in PR 8 can dispatch correctly.
 *
 * Writes to `Leads` via /api/dashboard/leads. If a note is supplied, a
 * second POST lands in the `Notes` sheet so the rolling context shows up
 * in the Lead detail timeline.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Zap, Loader2, Save, Phone, Store, Mail, MessageCircle, AtSign, Hash } from "lucide-react";
import { SlideOut } from "./slide-out";
import { LEAD_SOURCE_DOORS, type LeadSource } from "@/app/lib/lead-sources";

const SOURCE_ICONS: Record<LeadSource, React.ComponentType<{ className?: string }>> = {
  "Walk-in": Store,
  "Phone": Phone,
  "WhatsApp": MessageCircle,
  "Email": Mail,
  "Meta IG": AtSign,
  "Meta FB": Hash,
  "Website": Mail,
  "Trade Program": Store,
  "Referral": Store,
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  "Walk-in": "Walk-in",
  "Phone": "Phone",
  "WhatsApp": "WhatsApp",
  "Email": "Email",
  "Meta IG": "Meta IG",
  "Meta FB": "Meta FB",
  "Website": "Website",
  "Trade Program": "Trade",
  "Referral": "Referral",
};

interface BrandOption {
  slug: string;
  name: string;
}

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  source: "Walk-in" as LeadSource,
  brand_slugs: [] as string[],
  notes: "",
};

export const QuickCapture = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);

  useEffect(() => {
    if (!open || brandOptions.length > 0) return;
    fetch("/api/dashboard/brands")
      .then((r) => r.json())
      .then((d) => {
        const brands = (d.brands ?? []) as BrandOption[];
        setBrandOptions(
          brands
            .map((b) => ({ slug: b.slug, name: b.name }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      })
      .catch(() => {
        // ignore — brand picker just won't load
      });
  }, [open, brandOptions.length]);

  const toggleBrand = (slug: string) => {
    setForm((prev) => ({
      ...prev,
      brand_slugs: prev.brand_slugs.includes(slug)
        ? prev.brand_slugs.filter((s) => s !== slug)
        : [...prev.brand_slugs, slug],
    }));
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (form.source === "Walk-in" && !form.email.trim()) {
      toast.error("Email is required for walk-ins — we email the quote later");
      return;
    }

    setSaving(true);
    try {
      const leadRes = await fetch("/api/dashboard/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          source: form.source,
          status: "new",
          contact_type: "",
          interest: "",
          value: "",
          brand_slugs: form.brand_slugs.join("|"),
        }),
      });

      if (!leadRes.ok) throw new Error("Lead create failed");
      const { id } = await leadRes.json();

      // If a note was supplied, drop it into the Notes timeline too
      if (form.notes.trim() && id) {
        await fetch("/api/dashboard/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "lead",
            entityId: id,
            authorEmail: "admin@countercultures.com.mx",
            content: form.notes.trim(),
          }),
        }).catch(() => {
          // non-fatal — lead itself was saved
        });
      }

      toast.success(`Captured: ${form.name} (${form.source})`);
      setForm(emptyForm);
      setOpen(false);
    } catch (err) {
      console.error("[QuickCapture] submit failed", err);
      toast.error("Couldn't save lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Quick-Capture: log a walk-in, phone, WhatsApp, email, or Meta inquiry"
        aria-label="Quick-Capture Lead"
        className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-brand-copper/10 text-brand-copper hover:bg-brand-copper/20 transition-colors cursor-pointer"
      >
        <Zap className="w-5 h-5" />
      </button>

      <SlideOut
        open={open}
        onClose={() => {
          if (!saving) setOpen(false);
        }}
        title="Quick-Capture Lead"
        width="w-[480px]"
      >
        <div className="space-y-5">
          <p className="text-xs text-dash-text-secondary">
            10-second capture for any of the six inbound doors. Only name is
            required — everything else can be filled in later.
          </p>

          {/* Source — six doors */}
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
              Source
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LEAD_SOURCE_DOORS.map((value) => {
                const Icon = SOURCE_ICONS[value];
                const active = form.source === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, source: value }))}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                      active
                        ? "bg-brand-copper/10 text-brand-copper border-brand-copper/30"
                        : "border-dash-border text-dash-text-secondary hover:border-dash-text-secondary"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {SOURCE_LABELS[value]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
              Name <span className="text-dash-danger">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Full name"
              autoFocus
              className="w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
            />
          </div>

          {/* Email — required for walk-ins per R2-3 */}
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
              Email{form.source === "Walk-in" && <span className="text-dash-danger"> *</span>}
              {form.source === "Walk-in" && (
                <span className="ml-2 text-[10px] text-dash-text-secondary/80 font-normal">
                  walk-ins almost never leave with a printed quote — we email it later
                </span>
              )}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="email@example.com"
              className="w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+52 415 123 4567"
              className="w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
            />
          </div>

          {/* Brands */}
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
              Brands of interest{" "}
              <span className="text-dash-text-secondary/70 font-normal">
                ({form.brand_slugs.length} selected)
              </span>
            </label>
            {brandOptions.length === 0 ? (
              <p className="text-xs text-dash-text-secondary">Loading brands…</p>
            ) : (
              <div className="max-h-36 overflow-y-auto border border-dash-border rounded-lg p-2 bg-dash-bg">
                <div className="flex flex-wrap gap-1.5">
                  {brandOptions.map((b) => {
                    const active = form.brand_slugs.includes(b.slug);
                    return (
                      <button
                        key={b.slug}
                        type="button"
                        onClick={() => toggleBrand(b.slug)}
                        className={`px-2 py-0.5 rounded-full text-xs border transition-colors cursor-pointer ${
                          active
                            ? "bg-brand-copper/15 text-brand-copper border-brand-copper/30"
                            : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-text-secondary"
                        }`}
                      >
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Anything worth remembering later…"
              rows={3}
              className="w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2.5 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-dash-border">
            <button
              onClick={submit}
              disabled={saving || !form.name.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving…" : "Capture Lead"}
            </button>
            <button
              onClick={() => setOpen(false)}
              disabled={saving}
              className="px-4 py-2.5 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </SlideOut>
    </>
  );
};
