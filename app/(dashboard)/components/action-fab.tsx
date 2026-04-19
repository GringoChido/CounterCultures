"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { QuickCapture } from "./quick-capture";
import { useFabStore } from "@/app/lib/stores/fab-store";

const ActionFab = () => {
  const pulseSessionsRemaining = useFabStore((s) => s.pulseSessionsRemaining);
  const hasInteracted = useFabStore((s) => s.hasInteracted);
  const consumePulseSession = useFabStore((s) => s.consumePulseSession);
  const markInteracted = useFabStore((s) => s.markInteracted);
  const consumedRef = useRef(false);

  useEffect(() => {
    if (consumedRef.current) return;
    consumedRef.current = true;
    consumePulseSession();
  }, [consumePulseSession]);

  const shouldPulse = !hasInteracted && pulseSessionsRemaining > 0;

  const openChat = () => {
    markInteracted();
    window.dispatchEvent(new CustomEvent("cc:open-chat"));
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
      <QuickCapture />
      <button
        onClick={openChat}
        aria-label="Open AI chat"
        className={`relative w-12 h-12 rounded-full bg-dash-surface border border-brand-copper text-brand-copper hover:bg-brand-copper hover:text-white transition-colors cursor-pointer flex items-center justify-center shadow-sm ${
          shouldPulse ? "before:content-[''] before:absolute before:inset-0 before:rounded-full before:bg-brand-copper/30 before:animate-ping" : ""
        }`}
      >
        <MessageCircle className="w-5 h-5 relative z-10" />
      </button>
    </div>
  );
};

export { ActionFab };
