"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Send,
  Clock,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import type { SocialPlatform, CreatePostPayload } from "@/app/lib/social/types";
import { useProductInsert } from "@/app/(dashboard)/components/product-insert-context";

const CHAR_LIMITS: Record<SocialPlatform, number> = {
  facebook: 63206,
  instagram: 2200,
};

interface PostComposerProps {
  onPublish?: (payload: CreatePostPayload) => void;
}

export function PostComposer({ onPublish }: PostComposerProps) {
  const [message, setMessage] = useState("");
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(["instagram", "facebook"]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { consumeInsert, pendingInsert, openCommandPalette } = useProductInsert();

  useEffect(() => {
    if (pendingInsert) {
      const inserted = consumeInsert();
      if (inserted) {
        const productUrl = `https://countercultures.mx/en/shop/${inserted.category}/p/${inserted.slug}`;
        setMessage((prev) => prev + (prev ? "\n\n" : "") + `${inserted.product} by ${inserted.brand}\n$${inserted.unitPrice.toLocaleString()} MXN\n${productUrl}`);
        if (inserted.image && !mediaUrl) setMediaUrl(inserted.image);
        toast.success(`Tagged: ${inserted.product}`);
      }
    }
  }, [pendingInsert, consumeInsert, mediaUrl]);

  const togglePlatform = (p: SocialPlatform) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const charLimit = Math.min(
    ...platforms.map((p) => CHAR_LIMITS[p])
  );
  const charCount = message.length;
  const charWarning = charCount > charLimit * 0.9;
  const charOver = charCount > charLimit;

  const canPublish =
    message.trim().length > 0 &&
    platforms.length > 0 &&
    !charOver &&
    !publishing &&
    (platforms.includes("instagram") ? mediaUrl.trim().length > 0 : true) &&
    (!scheduleMode || scheduleDate.trim().length > 0);

  async function handlePublish() {
    if (!canPublish) return;

    setPublishing(true);
    setResult(null);

    const payload: CreatePostPayload = {
      platforms,
      message,
      mediaUrl: mediaUrl || undefined,
      publishNow: !scheduleMode,
      scheduledAt: scheduleMode
        ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
        : undefined,
    };

    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.anySuccess || data.results) {
        setResult({
          type: "success",
          message: scheduleMode
            ? `Post scheduled for ${format(new Date(`${scheduleDate}T${scheduleTime}`), "MMM d, yyyy 'at' h:mm a")}`
            : "Post published successfully!",
        });
        // Reset form
        setMessage("");
        setMediaUrl("");
        setScheduleMode(false);
        setScheduleDate("");
        onPublish?.(payload);
      } else {
        setResult({
          type: "error",
          message: data.error || "Failed to publish. Check your Meta API credentials.",
        });
      }
    } catch {
      setResult({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Result Toast */}
      {result && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            result.type === "success"
              ? "bg-dash-success-soft border-dash-success text-dash-success"
              : "bg-dash-danger-soft border-dash-danger text-dash-danger"
          }`}
        >
          {result.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <p className="text-sm">{result.message}</p>
          <button
            onClick={() => setResult(null)}
            className="ml-auto text-current opacity-50 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Composer */}
        <div className="lg:col-span-3 space-y-4">
          {/* Platform Select */}
          <div>
            <label className="text-xs font-semibold text-dash-text-secondary uppercase tracking-wider mb-2 block">
              Platforms
            </label>
            <div className="flex gap-2">
              {(["instagram", "facebook"] as SocialPlatform[]).map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                    platforms.includes(p)
                      ? p === "instagram"
                        ? "bg-dash-cat-pink-soft border-dash-cat-pink text-dash-cat-pink"
                        : "bg-dash-info-soft border-dash-info text-dash-info"
                      : "bg-dash-bg border-dash-border text-dash-text-secondary hover:border-dash-text-secondary"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      p === "instagram" ? "bg-dash-cat-pink" : "bg-dash-info"
                    }`}
                  />
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-semibold text-dash-text-secondary uppercase tracking-wider mb-2 block">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your post content here..."
              rows={6}
              className="w-full bg-dash-bg border border-dash-border rounded-xl px-4 py-3 text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper/50 resize-none"
            />
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs ${
                  charOver
                    ? "text-dash-danger font-semibold"
                    : charWarning
                    ? "text-dash-warn"
                    : "text-dash-text-secondary"
                }`}
              >
                {charCount.toLocaleString()} / {charLimit.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Media URL */}
          <div>
            <label className="text-xs font-semibold text-dash-text-secondary uppercase tracking-wider mb-2 block">
              Media URL {platforms.includes("instagram") && (
                <span className="text-dash-danger normal-case">(required for Instagram)</span>
              )}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-dash-bg border border-dash-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper/50"
                />
              </div>
              {mediaUrl && (
                <button
                  onClick={() => setMediaUrl("")}
                  className="p-2.5 rounded-xl bg-dash-bg border border-dash-border text-dash-text-secondary hover:text-dash-danger transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tag Product */}
          <div>
            <button
              onClick={openCommandPalette}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-dash-bg border border-dash-border text-dash-text-secondary hover:text-brand-copper hover:border-brand-copper/30 transition-all cursor-pointer"
            >
              <Package className="w-4 h-4" />
              Tag Product
            </button>
          </div>

          {/* Schedule Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScheduleMode(!scheduleMode)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                scheduleMode
                  ? "bg-brand-copper/10 border-brand-copper/20 text-brand-copper"
                  : "bg-dash-bg border-dash-border text-dash-text-secondary hover:text-dash-text"
              }`}
            >
              <Clock className="w-4 h-4" />
              Schedule for later
            </button>
          </div>

          {scheduleMode && (
            <div className="flex gap-3">
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                className="bg-dash-bg border border-dash-border rounded-xl px-4 py-2.5 text-sm text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="bg-dash-bg border border-dash-border rounded-xl px-4 py-2.5 text-sm text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
              />
            </div>
          )}

          {/* Publish Button */}
          <button
            onClick={handlePublish}
            disabled={!canPublish}
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              canPublish
                ? "bg-brand-copper text-white hover:bg-brand-copper/90 shadow-sm"
                : "bg-dash-bg text-dash-text-secondary border border-dash-border cursor-not-allowed"
            }`}
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : scheduleMode ? (
              <Clock className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {publishing
              ? "Publishing..."
              : scheduleMode
              ? "Schedule Post"
              : "Publish Now"}
          </button>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-2 space-y-4">
          <label className="text-xs font-semibold text-dash-text-secondary uppercase tracking-wider block">
            Preview
          </label>

          {platforms.includes("instagram") && (
            <div className="bg-dash-surface rounded-xl border border-dash-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-dash-border">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dash-cat-pink via-dash-danger to-dash-warn" />
                <div>
                  <p className="text-xs font-semibold text-dash-text-secondary">countercultures</p>
                  <p className="text-[10px] text-dash-text-muted">San Miguel de Allende</p>
                </div>
              </div>
              {mediaUrl && (
                <div className="aspect-square bg-dash-surface-2 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-dash-text-muted" />
                </div>
              )}
              <div className="p-4">
                <p className="text-xs text-dash-text-secondary leading-relaxed">
                  <span className="font-semibold">countercultures</span>{" "}
                  {message || "Your post content will appear here..."}
                </p>
              </div>
            </div>
          )}

          {platforms.includes("facebook") && (
            <div className="bg-dash-surface rounded-xl border border-dash-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-dash-info flex items-center justify-center text-white text-xs font-bold">
                  CC
                </div>
                <div>
                  <p className="text-xs font-semibold text-dash-text-secondary">Counter Cultures</p>
                  <p className="text-[10px] text-dash-text-muted">Just now · 🌐</p>
                </div>
              </div>
              <div className="px-4 pb-3">
                <p className="text-sm text-dash-text-secondary leading-relaxed">
                  {message || "Your post content will appear here..."}
                </p>
              </div>
              {mediaUrl && (
                <div className="aspect-video bg-dash-surface-2 flex items-center justify-center border-t border-dash-border">
                  <ImageIcon className="w-12 h-12 text-dash-text-muted" />
                </div>
              )}
              <div className="flex items-center justify-around py-2 border-t border-dash-border text-xs text-dash-text-secondary">
                <span>👍 Like</span>
                <span>💬 Comment</span>
                <span>↗️ Share</span>
              </div>
            </div>
          )}

          {platforms.length === 0 && (
            <div className="bg-dash-bg rounded-xl border border-dash-border p-8 text-center">
              <p className="text-sm text-dash-text-secondary">
                Select a platform to see preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
