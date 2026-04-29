"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useFocusTrap } from "./use-focus-trap";
import { focusRing } from "./focus-ring";
import {
  overlayInitial,
  overlayAnimate,
  overlayExit,
  dialogInitial,
  dialogAnimate,
  dialogExit,
  transitionFast,
} from "./motion-presets";

/**
 * Bare dialog wrapper — backdrop, centered container, role/aria-modal/aria-labelledby,
 * focus trap, Esc, body scroll lock. Use when you need full control of the chrome
 * (header, footer, layout). Pass `labelledBy` matching the id of your title element.
 */
interface DialogRootProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  zIndex?: number;
  children: ReactNode;
  /** Tailwind class for the inner box (positioning, max-width, etc.). */
  containerClassName?: string;
}

const DialogRoot = ({
  open,
  onClose,
  labelledBy,
  describedBy,
  zIndex = 50,
  children,
  containerClassName,
}: DialogRootProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0" style={{ zIndex }}>
          <motion.div
            initial={overlayInitial}
            animate={overlayAnimate}
            exit={overlayExit}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={labelledBy}
              aria-describedby={describedBy}
              tabIndex={-1}
              initial={dialogInitial}
              animate={dialogAnimate}
              exit={dialogExit}
              transition={transitionFast}
              className={`pointer-events-auto ${focusRing} ${containerClassName ?? ""}`}
            >
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  describedBy?: string;
  /**
   * If true, the modal will fill the viewport on screens below md.
   * Use for editing surfaces (preview-panel, product-picker, document-generator).
   */
  fullScreenOnMobile?: boolean;
}

const Modal = ({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
  describedBy,
  fullScreenOnMobile = false,
}: ModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const sizing = fullScreenOnMobile
    ? `inset-0 md:inset-auto md:relative md:w-full md:${maxWidth} md:max-h-[90vh] h-full md:h-auto`
    : `w-full ${maxWidth} max-h-[90vh]`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={overlayInitial}
            animate={overlayAnimate}
            exit={overlayExit}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-50"
            aria-hidden="true"
          />
          <div
            className={
              fullScreenOnMobile
                ? "fixed inset-0 z-50 md:flex md:items-center md:justify-center md:p-4"
                : "fixed inset-0 z-50 flex items-center justify-center p-4"
            }
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={describedBy}
              tabIndex={-1}
              initial={dialogInitial}
              animate={dialogAnimate}
              exit={dialogExit}
              transition={transitionFast}
              className={`bg-dash-surface md:rounded-xl border border-dash-border shadow-xl flex flex-col ${sizing} ${focusRing}`}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-dash-border shrink-0">
                <h2
                  id={titleId}
                  className="text-lg font-semibold text-dash-text"
                >
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className={`w-10 h-10 flex items-center justify-center rounded-lg hover:bg-dash-bg transition-colors cursor-pointer ${focusRing}`}
                >
                  <X className="w-5 h-5 text-dash-text-secondary" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export { Modal, DialogRoot };
export type { ModalProps, DialogRootProps };
