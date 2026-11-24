"use client";

import { CheckCircle2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

const VISIBLE_MS = 6000;

/**
 * A friendly confirmation ("Incident logged.") that slides in, stays for a
 * few seconds and can be dismissed (after transitions.dev / Bencho toasts).
 * It's a live region, so screen readers announce it too.
 */
export function Toast({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex justify-center md:inset-x-auto md:top-6 md:right-6 md:bottom-auto md:justify-end"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border border-success/20 bg-surface py-3 pr-2 pl-4 shadow-[0_12px_32px_-12px_rgb(14_94_90/0.45)]"
          >
            <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
            <p className="text-sm text-ink">{children}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Dismiss message"
              className="-mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-ink"
            >
              <X aria-hidden className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
