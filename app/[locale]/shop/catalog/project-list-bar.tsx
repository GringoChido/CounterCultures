"use client";

import { useState } from "react";
import { ShoppingBag, ChevronDown, X, Trash2, Loader2, Send, Check } from "lucide-react";
import { toast } from "sonner";
import { useProjectListStore } from "@/app/lib/stores/project-list-store";

const T = {
  en: {
    yourProject: "Your project list",
    empty: "No items yet. Click + Add to project on any product.",
    itemCount: (n: number) => `${n} item${n === 1 ? "" : "s"}`,
    request: "Request quote",
    submitting: "Sending…",
    qty: "Qty",
    remove: "Remove",
    clearAll: "Clear list",
    yourName: "Your name *",
    yourEmail: "Your email *",
    yourPhone: "Phone / WhatsApp (optional)",
    company: "Firm / company",
    projectName: "Project name / reference",
    notes: "Notes for Counter Cultures (finishes, lead time, delivery window…)",
    sendRequest: "Send quote request",
    thanks: "Thanks — we'll get back within 24 hours.",
    error: "Could not send the request. Please try again or email info@countercultures.com.mx",
    viewList: "View list",
  },
  es: {
    yourProject: "Tu lista de proyecto",
    empty: "Sin artículos. Toca + Agregar al proyecto en cualquier producto.",
    itemCount: (n: number) => `${n} artículo${n === 1 ? "" : "s"}`,
    request: "Solicitar cotización",
    submitting: "Enviando…",
    qty: "Cant",
    remove: "Quitar",
    clearAll: "Limpiar lista",
    yourName: "Tu nombre *",
    yourEmail: "Tu correo *",
    yourPhone: "Teléfono / WhatsApp (opcional)",
    company: "Despacho / empresa",
    projectName: "Nombre del proyecto / referencia",
    notes: "Notas para Counter Cultures (acabados, tiempo de entrega, ventana de envío…)",
    sendRequest: "Enviar solicitud",
    thanks: "Gracias — te respondemos en menos de 24 horas.",
    error: "No pudimos enviar la solicitud. Intenta de nuevo o escribe a info@countercultures.com.mx",
    viewList: "Ver lista",
  },
};

interface ProjectListBarProps {
  locale: "en" | "es";
}

const ProjectListBar = ({ locale }: ProjectListBarProps) => {
  const t = T[locale];
  const items = useProjectListStore((s) => s.items);
  const updateQty = useProjectListStore((s) => s.updateQty);
  const remove = useProjectListStore((s) => s.remove);
  const clear = useProjectListStore((s) => s.clear);

  const [expanded, setExpanded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [projectName, setProjectName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (items.length === 0 && !expanded) return null;

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  const submit = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error(locale === "es" ? "Nombre y correo son obligatorios" : "Name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/shop/request-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          contact: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            company: company.trim() || undefined,
            projectName: projectName.trim() || undefined,
          },
          notes: notes.trim() || undefined,
          items: items.map((i) => ({
            productId: i.id,
            sku: i.sku,
            name: i.name,
            brand: i.brand,
            quantity: i.quantity,
          })),
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSubmitted(true);
      toast.success(t.thanks);
      // Clear list + close after a beat
      setTimeout(() => {
        clear();
        setFormOpen(false);
        setExpanded(false);
        setSubmitted(false);
        setName("");
        setEmail("");
        setPhone("");
        setCompany("");
        setProjectName("");
        setNotes("");
      }, 2500);
    } catch {
      toast.error(t.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating pill */}
      {!expanded && items.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3 bg-brand-copper text-white shadow-lg hover:bg-brand-copper/90 transition-colors cursor-pointer rounded-full"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="font-body text-sm font-medium">
            {t.itemCount(items.length)}
          </span>
          <span className="font-body text-xs opacity-80">{t.viewList} →</span>
        </button>
      )}

      {/* Expanded sheet */}
      {expanded && (
        <div className="fixed inset-0 z-[70] flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setExpanded(false);
              setFormOpen(false);
            }}
            aria-hidden
          />
          <aside className="relative ml-auto w-[520px] max-w-[95vw] h-full bg-white border-l border-brand-stone/15 shadow-xl flex flex-col overflow-hidden">
            <header className="px-6 py-5 border-b border-brand-stone/10 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-brand-copper font-body font-semibold">
                  {t.itemCount(items.length)} · {totalQty} total
                </div>
                <h3 className="mt-1 font-display text-2xl font-light tracking-wide text-brand-charcoal leading-tight">
                  {t.yourProject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  setFormOpen(false);
                }}
                className="p-1.5 text-brand-stone hover:text-brand-charcoal cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-16 text-center text-sm font-body text-brand-stone px-6">
                  {t.empty}
                </div>
              ) : !formOpen ? (
                <ul className="divide-y divide-brand-stone/10">
                  {items.map((it) => (
                    <li key={it.id} className="px-6 py-4 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[10px] text-brand-stone truncate">
                          {it.sku}
                        </div>
                        <div className="font-body text-sm text-brand-charcoal truncate">
                          {it.name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-brand-stone">
                          {it.brand} · {it.category}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) =>
                            updateQty(it.id, Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-14 px-2 py-1 text-sm border border-brand-stone/20 bg-white focus:outline-none focus:border-brand-copper font-body text-center"
                        />
                        <button
                          type="button"
                          onClick={() => remove(it.id)}
                          className="p-1.5 text-brand-stone hover:text-red-500 cursor-pointer"
                          title={t.remove}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : submitted ? (
                <div className="py-20 px-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-copper flex items-center justify-center">
                    <Check className="w-7 h-7 text-white" />
                  </div>
                  <p className="font-display text-xl text-brand-charcoal">
                    {t.thanks}
                  </p>
                </div>
              ) : (
                // Quote request form
                <div className="px-6 py-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.yourName}
                      className="px-3 py-2.5 text-sm border border-brand-stone/20 bg-white focus:outline-none focus:border-brand-copper font-body"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.yourEmail}
                      className="px-3 py-2.5 text-sm border border-brand-stone/20 bg-white focus:outline-none focus:border-brand-copper font-body"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t.yourPhone}
                      className="px-3 py-2.5 text-sm border border-brand-stone/20 bg-white focus:outline-none focus:border-brand-copper font-body"
                    />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={t.company}
                      className="px-3 py-2.5 text-sm border border-brand-stone/20 bg-white focus:outline-none focus:border-brand-copper font-body"
                    />
                  </div>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={t.projectName}
                    className="w-full px-3 py-2.5 text-sm border border-brand-stone/20 bg-white focus:outline-none focus:border-brand-copper font-body"
                  />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.notes}
                    rows={4}
                    className="w-full px-3 py-2.5 text-sm border border-brand-stone/20 bg-white focus:outline-none focus:border-brand-copper font-body resize-none"
                  />
                </div>
              )}
            </div>

            {/* Footer actions */}
            {items.length > 0 && !submitted && (
              <footer className="border-t border-brand-stone/10 bg-white px-6 py-4 flex items-center gap-2">
                {!formOpen ? (
                  <>
                    <button
                      type="button"
                      onClick={clear}
                      className="px-3 py-2.5 text-xs text-brand-stone hover:text-red-500 font-body cursor-pointer"
                    >
                      {t.clearAll}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormOpen(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-brand-copper text-white font-body font-semibold hover:bg-brand-copper/90 transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      {t.request}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setFormOpen(false)}
                      disabled={submitting}
                      className="px-3 py-2.5 text-xs text-brand-stone hover:text-brand-charcoal font-body cursor-pointer"
                    >
                      ← {locale === "es" ? "Regresar" : "Back"}
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-brand-copper text-white font-body font-semibold hover:bg-brand-copper/90 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {submitting ? t.submitting : t.sendRequest}
                    </button>
                  </>
                )}
              </footer>
            )}
          </aside>
        </div>
      )}
    </>
  );
};

export { ProjectListBar };
