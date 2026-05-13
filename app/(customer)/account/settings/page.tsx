"use client";

import { useState, useEffect } from "react";

const SettingsPage = () => {
  const [waOptIn, setWaOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/customer/session");
        const data = await res.json();
        const userEmail = data?.user?.email;
        if (!userEmail) {
          window.location.href = "/account/sign-in";
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
        /* session check failed — redirect */
        window.location.href = "/account/sign-in";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="text-sm text-[#6B6B6B]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-light tracking-wider text-[#2C2C2C]">
            Account Settings
          </h1>
          <p className="font-body text-sm text-[#6B6B6B] mt-2">{email}</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E5E0DB]">
          <h2 className="text-sm font-semibold text-[#2C2C2C] mb-4">
            Communication Preferences
          </h2>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={waOptIn}
              onChange={(e) => setWaOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#E5E0DB] text-[#B87333] focus:ring-[#B87333]/40 cursor-pointer"
            />
            <span className="text-sm text-[#6B6B6B] leading-relaxed">
              Receive WhatsApp messages about new products, promotions, and
              exclusive events
            </span>
          </label>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-6 w-full py-2.5 bg-[#B87333] text-white text-sm font-medium rounded-lg hover:bg-[#A0632D] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save preferences"}
          </button>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-[#B87333] hover:text-[#A0632D] transition-colors"
          >
            ← Back to shop
          </a>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
