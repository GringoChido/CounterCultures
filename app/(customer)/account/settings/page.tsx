"use client";

import { useState, useEffect } from "react";
import NextLink from "next/link";
import { Loader2 } from "lucide-react";
import { readClientLocale } from "@/app/lib/customer-signin-helpers";

const SettingsPage = () => {
  const [waOptIn, setWaOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [lang] = useState<"en" | "es">(() => readClientLocale());

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/customer/session");
        const data = await res.json();
        const userEmail = data?.user?.email;
        if (!userEmail) {
          window.location.href = "/account/sign-in?intent=settings&callbackUrl=" + encodeURIComponent("/account/settings");
          return;
        }
        setEmail(userEmail);

        const prefRes = await fetch(
          `/api/account/preferences?email=${encodeURIComponent(userEmail)}`
        );
        if (prefRes.ok) {
          const prefs = await prefRes.json();
          setWaOptIn(prefs.whatsapp_marketing_opt_in === "TRUE");
        }
      } catch {
        window.location.href = "/account/sign-in?intent=settings&callbackUrl=" + encodeURIComponent("/account/settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, []);

  const handleSave = async () => {
    if (!email) return;
    setSaving(true);
    try {
      await fetch("/api/account/whatsapp-opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, optIn: waOptIn }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* best-effort */
    } finally {
      setSaving(false);
    }
  };

  const settingsT = {
    en: {
      title: "Account Settings",
      commsTitle: "Communication Preferences",
      waLabel: "Receive WhatsApp messages about new products, promotions, and exclusive events",
      save: "Save preferences",
      saving: "Saving…",
      saved: "Saved!",
      back: "← Back to shop",
      loading: "Loading…",
    },
    es: {
      title: "Configuración de cuenta",
      commsTitle: "Preferencias de comunicación",
      waLabel: "Recibir mensajes de WhatsApp sobre nuevos productos, promociones y eventos exclusivos",
      save: "Guardar preferencias",
      saving: "Guardando…",
      saved: "¡Guardado!",
      back: "← Volver a la tienda",
      loading: "Cargando…",
    },
  };
  const st = settingsT[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-linen flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-dash-text-secondary">
          <Loader2 className="w-4 h-4 animate-spin" />
          {st.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-linen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-light tracking-wider text-brand-charcoal">
            {st.title}
          </h1>
          <p className="font-body text-sm text-dash-text-secondary mt-2">{email}</p>
        </div>

        <div className="bg-dash-surface rounded-xl p-8 shadow-sm border border-dash-border">
          <h2 className="text-sm font-semibold text-brand-charcoal mb-4">
            {st.commsTitle}
          </h2>

          <label htmlFor="wa-marketing" className="flex items-start gap-2.5 cursor-pointer">
            <input
              id="wa-marketing"
              type="checkbox"
              checked={waOptIn}
              onChange={(e) => setWaOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-dash-border text-brand-copper focus:ring-brand-copper/40 cursor-pointer"
            />
            <span className="text-sm text-dash-text-secondary leading-relaxed">
              {st.waLabel}
            </span>
          </label>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-6 w-full py-2.5 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper-dark disabled:opacity-50 transition-colors cursor-pointer min-h-[44px]"
          >
            {saving ? st.saving : saved ? st.saved : st.save}
          </button>
        </div>

        <div className="text-center mt-6">
          <NextLink
            href="/"
            className="text-sm text-brand-copper hover:text-brand-copper-dark transition-colors"
          >
            {st.back}
          </NextLink>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
