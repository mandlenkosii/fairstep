"use client";

import { CheckCircle2, FileText, Lock } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { HeroCasePreview } from "./product-previews";

// Three.js only loads in the browser, after the page is interactive.
const StepsScene = dynamic(() => import("./steps-scene"), { ssr: false });

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function FloatingCard({
  children,
  className,
  delay,
}: {
  children: ReactNode;
  className: string;
  delay: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`absolute z-10 rounded-xl border border-line/80 bg-surface/95 p-3 text-sm shadow-[0_18px_40px_-18px_rgb(28_43_42/0.45)] backdrop-blur ${className}`}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={
        reduce
          ? { opacity: 1 }
          : {
              opacity: 1,
              y: [0, -6, 0],
              transition: {
                opacity: { delay, duration: 0.5 },
                y: { delay, duration: 5, repeat: Infinity, ease: "easeInOut" },
              },
            }
      }
    >
      {children}
    </motion.div>
  );
}

/**
 * The hero's right side: the 3D Fair Steps with real FairStep moments
 * floating around it. Falls back to the static case preview without WebGL.
 */
export function HeroVisual() {
  const reduce = useReducedMotion();
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    // Decided after mount: the server can't know whether the device has WebGL.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(hasWebGL());
  }, []);

  if (webgl === false) return <HeroCasePreview />;

  return (
    <div className="relative mx-auto h-[360px] w-full max-w-xl sm:h-[460px] md:h-[520px]">
      <div className="absolute inset-0">{webgl && <StepsScene still={Boolean(reduce)} />}</div>

      <FloatingCard className="top-2 left-0 max-w-[15rem] sm:top-6" delay={0.6}>
        <p className="flex items-center gap-2 font-semibold text-ink">
          <Lock aria-hidden className="size-4 text-warning-strong" /> Hearing blocked
        </p>
        <p className="mt-1 text-xs text-muted">
          The employee must get at least 2 working days to prepare.
        </p>
      </FloatingCard>

      <FloatingCard className="top-1/2 right-0 hidden sm:block" delay={0.9}>
        <p className="flex items-center gap-2 font-semibold text-ink">
          <FileText aria-hidden className="size-4 text-danger" /> Notice of hearing
        </p>
        <p className="mt-1 text-xs text-muted">PDF generated · FS-2026-0012</p>
      </FloatingCard>

      <FloatingCard className="bottom-2 left-6 sm:bottom-8 sm:left-12" delay={1.2}>
        <p className="flex items-center gap-2 font-semibold text-ink">
          <CheckCircle2 aria-hidden className="size-4 text-success" /> Approved by your consultant
        </p>
        <p className="mt-1 text-xs text-muted">Naledi Dlamini · every step on record</p>
      </FloatingCard>
    </div>
  );
}
