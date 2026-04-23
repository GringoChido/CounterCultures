"use client";

import { useEffect } from "react";

/**
 * Fires window.print() once on mount when the quote page loads with ?auto=1.
 * User gets the native print dialog with "Save as PDF" as a destination.
 * Separate client component so the server-rendered quote isn't client-side.
 */
const AutoPrint = () => {
  useEffect(() => {
    // Small delay so fonts and images settle before the preview renders.
    const t = setTimeout(() => {
      try {
        window.print();
      } catch {
        // Print dialog can be suppressed by some browsers without user gesture;
        // silently ignore and rely on the on-screen Cmd+P hint.
      }
    }, 400);
    return () => clearTimeout(t);
  }, []);
  return null;
};

export { AutoPrint };
