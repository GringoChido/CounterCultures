"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  Send,
  ArrowLeft,
  Pencil,
  Check,
} from "lucide-react";
import {
  useProjectStore,
  SPECIAL_PRICING_THRESHOLD_MXN,
} from "@/app/lib/project-store";
import { useCartStore } from "@/app/lib/stores/cart-store";
import { computeIva } from "@/app/lib/iva";
import { useUiStore } from "@/app/lib/stores/ui-store";

const fmtMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const ProjectDetailPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);
  const getProject = useProjectStore((s) => s.getProject);
  const rename = useProjectStore((s) => s.rename);
  const removeItem = useProjectStore((s) => s.removeItem);
  const updateItemQty = useProjectStore((s) => s.updateItemQty);
  const projectSubtotal = useProjectStore((s) => s.projectSubtotal);
  const addToCart = useCartStore((s) => s.add);
  const openCart = useUiStore((s) => s.openCart);

  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [quoteForm, setQuoteForm] = useState(false);
  const [quoteEmail, setQuoteEmail] = useState("");
  const [quoteName, setQuoteName] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);

  useEffect(() => setMounted(true), []);

  const project = mounted ? getProject(id) : undefined;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="text-sm text-[#6B6B6B]">Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[#6B6B6B] mb-4">Project not found</p>
          <Link
            href="/account/projects"
            className="text-sm text-[#B87333] hover:text-[#A0632D]"
          >
            &larr; Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = projectSubtotal(id);
  const { iva, total } = computeIva(subtotal, "MX");
  const eligible = subtotal >= SPECIAL_PRICING_THRESHOLD_MXN;
  const pct = Math.min(
    (subtotal / SPECIAL_PRICING_THRESHOLD_MXN) * 100,
    100
  );

  const handleRename = () => {
    const trimmed = editName.trim();
    if (trimmed) rename(id, trimmed);
    setEditing(false);
  };

  const handleMoveToCart = () => {
    for (const item of project.items) {
      addToCart({
        id: item.productId,
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        category: item.category,
        currency: item.currency,
        listPrice: item.unitPrice,
        quantity: item.qty,
        imageSrc: item.imageSrc,
        productHref: item.productHref,
        availability: "made-to-order",
        buyable: true,
      });
    }
    openCart();
  };

  const handleRequestQuote = async () => {
    if (!quoteEmail.trim()) return;
    setQuoteSending(true);
    try {
      await fetch(`/api/projects/${id}/request-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: quoteEmail,
          name: quoteName,
          notes: quoteNotes,
        }),
      });
      setQuoteSent(true);
      setQuoteForm(false);
    } catch {
      // best-effort
    } finally {
      setQuoteSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/account/projects"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#2C2C2C] transition-colors font-body mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Projects
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  autoFocus
                  className="font-display text-3xl font-light tracking-wider text-[#2C2C2C] bg-transparent border-b border-[#B87333] focus:outline-none"
                />
                <button
                  onClick={handleRename}
                  className="p-1 text-[#B87333] cursor-pointer"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-light tracking-wider text-[#2C2C2C]">
                  {project.name}
                </h1>
                <button
                  onClick={() => {
                    setEditName(project.name);
                    setEditing(true);
                  }}
                  className="p-1 text-[#E5E0DB] hover:text-[#B87333] transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`px-2 py-0.5 text-[10px] font-body font-semibold rounded-full uppercase tracking-wider ${
                  project.status === "quote-requested"
                    ? "bg-[#B87333]/10 text-[#B87333]"
                    : "bg-[#E5E0DB]/50 text-[#6B6B6B]"
                }`}
              >
                {project.status === "quote-requested"
                  ? "Quote Requested"
                  : "Draft"}
              </span>
              <span className="font-body text-xs text-[#6B6B6B]">
                {project.items.length}{" "}
                {project.items.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-xl border border-[#E5E0DB] p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-xs text-[#6B6B6B]">
              Special Project Pricing Progress
            </p>
            <p className="font-mono text-xs text-[#2C2C2C]">
              {fmtMXN(subtotal)} / {fmtMXN(SPECIAL_PRICING_THRESHOLD_MXN)}
            </p>
          </div>
          <div className="h-2 bg-[#F0ECE6] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                eligible ? "bg-[#B87333]" : "bg-[#B87333]/40"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 font-body text-xs">
            {eligible ? (
              <span className="text-[#B87333] font-semibold">
                This project qualifies for special pricing. Request a quote
                below.
              </span>
            ) : (
              <span className="text-[#6B6B6B]">
                Add {fmtMXN(SPECIAL_PRICING_THRESHOLD_MXN - subtotal)} more to
                unlock special project pricing
              </span>
            )}
          </p>
        </div>

        {/* Items */}
        {project.items.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E0DB] p-10 text-center">
            <p className="text-sm text-[#6B6B6B]">
              No items yet. Browse the shop and save items to this project.
            </p>
            <Link
              href="/en/shop"
              className="inline-block mt-4 text-sm text-[#B87333] hover:text-[#A0632D] font-medium"
            >
              Browse Shop &rarr;
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E0DB] overflow-hidden">
            <div className="divide-y divide-[#F0ECE6]">
              {project.items.map((item) => (
                <div key={item.productId} className="flex gap-4 p-4">
                  <Link
                    href={item.productHref}
                    className="shrink-0 w-16 h-16 bg-[#F0ECE6] overflow-hidden"
                  >
                    {item.imageSrc ? (
                      <Image
                        src={item.imageSrc}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={item.productHref}
                      className="font-body text-sm text-[#2C2C2C] hover:text-[#B87333] transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="font-body text-xs text-[#6B6B6B] mt-0.5">
                      {item.brand} · {item.sku}
                    </p>
                    {item.notes && (
                      <p className="font-body text-xs text-[#6B6B6B] mt-0.5 italic">
                        {item.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateItemQty(id, item.productId, item.qty - 1)
                        }
                        className="p-1 text-[#6B6B6B] hover:text-[#2C2C2C] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-xs text-[#2C2C2C] w-6 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() =>
                          updateItemQty(id, item.productId, item.qty + 1)
                        }
                        className="p-1 text-[#6B6B6B] hover:text-[#2C2C2C] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <span className="font-mono text-sm text-[#2C2C2C]">
                      {fmtMXN(item.unitPrice * item.qty)}
                    </span>
                    <button
                      onClick={() => removeItem(id, item.productId)}
                      className="p-1 text-[#E5E0DB] hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-[#E5E0DB] px-4 py-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-body text-sm text-[#6B6B6B]">
                  Subtotal (net)
                </span>
                <span className="font-mono text-sm text-[#2C2C2C]">
                  {fmtMXN(subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-sm text-[#6B6B6B]">
                  IVA (16%)
                </span>
                <span className="font-mono text-sm text-[#2C2C2C]">
                  {fmtMXN(iva)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#B87333]/30">
                <span className="font-body text-base font-medium text-[#2C2C2C]">
                  Total
                </span>
                <span className="font-mono text-lg text-[#2C2C2C]">
                  {fmtMXN(total)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {project.items.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            {eligible && !quoteSent && (
              <>
                {quoteForm ? (
                  <div className="bg-white rounded-xl border border-[#B87333]/30 p-5 space-y-3">
                    <h3 className="font-display text-lg font-light text-[#2C2C2C]">
                      Request Special Project Pricing
                    </h3>
                    <input
                      type="text"
                      value={quoteName}
                      onChange={(e) => setQuoteName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2.5 text-sm border border-[#E5E0DB] rounded-lg focus:outline-none focus:border-[#B87333] font-body"
                    />
                    <input
                      type="email"
                      value={quoteEmail}
                      onChange={(e) => setQuoteEmail(e.target.value)}
                      placeholder="Your email"
                      className="w-full px-3 py-2.5 text-sm border border-[#E5E0DB] rounded-lg focus:outline-none focus:border-[#B87333] font-body"
                    />
                    <textarea
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm border border-[#E5E0DB] rounded-lg focus:outline-none focus:border-[#B87333] font-body resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleRequestQuote}
                        disabled={!quoteEmail.trim() || quoteSending}
                        className="flex-1 py-3 bg-[#B87333] text-white text-sm font-body font-medium rounded-lg hover:bg-[#A0632D] disabled:opacity-50 cursor-pointer disabled:cursor-default transition-colors flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {quoteSending
                          ? "Sending..."
                          : "Request Special Pricing"}
                      </button>
                      <button
                        onClick={() => setQuoteForm(false)}
                        className="px-4 py-3 text-sm font-body text-[#6B6B6B] hover:text-[#2C2C2C] cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setQuoteForm(true)}
                    className="w-full py-4 bg-[#B87333] text-white text-sm font-body font-medium rounded-lg hover:bg-[#A0632D] transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Request Special Project Pricing
                  </button>
                )}
              </>
            )}

            {quoteSent && (
              <div className="bg-[#B87333]/5 border border-[#B87333]/20 rounded-xl p-5 text-center">
                <p className="font-body text-sm text-[#B87333] font-medium">
                  Quote request sent! Roger will reply within 24 hours.
                </p>
              </div>
            )}

            <button
              onClick={handleMoveToCart}
              className="w-full py-3.5 border border-[#E5E0DB] text-[#2C2C2C] text-sm font-body font-medium rounded-lg hover:border-[#B87333]/40 hover:text-[#B87333] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Move All to Cart
            </button>
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-sm text-[#B87333] hover:text-[#A0632D] transition-colors font-body"
          >
            &larr; Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
