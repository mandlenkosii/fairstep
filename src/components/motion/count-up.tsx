"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * A number that counts up once when it scrolls into view, e.g. "193,069" or "51%".
 * The final value is rendered from the start (server, screen readers, tests);
 * the browser only animates the digits on screen.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const reduce = useReducedMotion();
  const match = value.match(/^([^\d]*)([\d,]+)(.*)$/);

  useEffect(() => {
    const element = ref.current;
    if (!element || !inView || reduce || !match) return;
    const [, prefix, digits, suffix] = match;
    const target = Number(digits.replaceAll(",", ""));
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (latest) => {
        const n = String(Math.round(latest)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        element.textContent = `${prefix}${n}${suffix}`;
      },
      onComplete: () => {
        element.textContent = value;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
