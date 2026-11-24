"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

/** Real screens from the live app (docs/screenshots), not mock-ups. */
const SCREENS = [
  {
    src: "/screens/incidents-desktop.png",
    label: "Incident log",
    alt: "Incident log with categories and case references",
  },
  {
    src: "/screens/case-workflow-desktop.png",
    label: "A case, step by step",
    alt: "A case with the Fair Steps stepper and the outcome step locked with its reason",
  },
  {
    src: "/screens/owner-dashboard-desktop.png",
    label: "Owner dashboard",
    alt: "Owner dashboard with open cases, hearings this week and cases documented",
  },
  {
    src: "/screens/consultant-queue-desktop.png",
    label: "Consultant review",
    alt: "Consultant review queue across client businesses",
  },
  {
    src: "/screens/admin-overview-desktop.png",
    label: "Admin, counts only",
    alt: "Admin overview showing platform counts without personal details",
  },
];

const CENTRE = (SCREENS.length - 1) / 2;

/**
 * A gentle curved wall of the real product (after HorizonX's 3D showcase).
 * On phones it becomes a simple swipeable row.
 */
export function ScreensGallery() {
  const reduce = useReducedMotion();
  return (
    <>
      <div className="hidden [perspective:1800px] md:block">
        <ul className="flex items-center justify-center gap-0 [transform-style:preserve-3d]">
          {SCREENS.map((screen, i) => {
            const offset = i - CENTRE;
            return (
              <motion.li
                key={screen.src}
                className="-mx-6 w-[30%] shrink-0 first:ml-0 last:mr-0"
                style={{ zIndex: 10 - Math.abs(offset) }}
                initial={
                  reduce
                    ? false
                    : { opacity: 0, rotateY: -offset * 28, z: -Math.abs(offset) * 140 - 120 }
                }
                whileInView={{
                  opacity: 1,
                  rotateY: -offset * 22,
                  z: -Math.abs(offset) * 120,
                }}
                whileHover={{ rotateY: 0, z: 40, transition: { duration: 0.35 } }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.9,
                  delay: Math.abs(offset) * 0.08,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
              >
                <figure className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_30px_60px_-30px_rgb(28_43_42/0.55)]">
                  <Image
                    src={screen.src}
                    alt={screen.alt}
                    width={1440}
                    height={900}
                    sizes="30vw"
                    className="h-auto w-full"
                  />
                  <figcaption className="border-t border-line px-3 py-2 text-xs font-semibold text-muted">
                    {screen.label}
                  </figcaption>
                </figure>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:hidden">
        {SCREENS.map((screen) => (
          <li key={screen.src} className="w-[85%] shrink-0 snap-center">
            <figure className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
              <Image
                src={screen.src}
                alt={screen.alt}
                width={1440}
                height={900}
                sizes="85vw"
                className="h-auto w-full"
              />
              <figcaption className="border-t border-line px-3 py-2 text-xs font-semibold text-muted">
                {screen.label}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </>
  );
}
