"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    console.error("[app/global-error.tsx]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0e0b07", color: "#ece4d3", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a95c", marginBottom: 16 }}>
              Counter Cultures
            </p>
            <h1 style={{ fontSize: 28, marginBottom: 12, fontWeight: 400 }}>Application error</h1>
            <p style={{ fontSize: 14, color: "#9b8f75", marginBottom: 24 }}>
              {error.digest ? `Reference: ${error.digest}` : "A critical error occurred."}
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ padding: "10px 18px", fontSize: 14, background: "#c9a95c", color: "#000", border: "none", borderRadius: 4, cursor: "pointer" }}
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
