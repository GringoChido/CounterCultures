"use client";

/**
 * Touch-and-mouse signature canvas — Roger's spec for PR-10. Miguel
 * captures customer signatures on his phone at delivery; the warehouse
 * captures them at the counter on pickup. Pure-React, no external lib —
 * we already have enough deps.
 *
 * Exposes a controlled "clear" + "exportPng" pair via a ref the caller
 * can hold on to. The parent owns the wrapping form (signer name, etc.)
 * and decides when to upload.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface SignatureCanvasHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toPngDataUrl: () => string;
}

interface Props {
  width?: number;
  height?: number;
  className?: string;
  onChange?: (empty: boolean) => void;
}

export const SignatureCanvas = forwardRef<SignatureCanvasHandle, Props>(
  ({ width = 480, height = 160, className = "", onChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [empty, setEmpty] = useState(true);

    // Re-fit canvas DPR on mount so lines aren't blurry on retina screens
    useEffect(() => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = window.devicePixelRatio || 1;
      c.width = width * dpr;
      c.height = height * dpr;
      c.style.width = `${width}px`;
      c.style.height = `${height}px`;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#1A1A1A";
      }
    }, [width, height]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        ctx?.clearRect(0, 0, c.width, c.height);
        setEmpty(true);
        onChange?.(true);
      },
      isEmpty: () => empty,
      toPngDataUrl: () => canvasRef.current?.toDataURL("image/png") ?? "",
    }));

    // Pointer events unify mouse + touch; we use a ref for the drawing
    // flag so it survives re-renders without rebinding handlers.
    const drawingRef = useRef(false);
    const ptr = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const c = canvasRef.current;
      if (!c) return null;
      const rect = c.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      drawingRef.current = true;
      const p = ptr(e);
      if (!p) return;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      c.setPointerCapture(e.pointerId);
    };
    const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (!ctx) return;
      const p = ptr(e);
      if (!p) return;
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      if (empty) {
        setEmpty(false);
        onChange?.(false);
      }
    };
    const onUp = () => {
      drawingRef.current = false;
    };

    return (
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={`block w-full bg-dash-surface border border-dash-border rounded-md touch-none cursor-crosshair ${className}`}
      />
    );
  },
);

SignatureCanvas.displayName = "SignatureCanvas";
