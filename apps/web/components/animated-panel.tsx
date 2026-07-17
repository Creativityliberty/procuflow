"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type AnimatedPanelProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function AnimatedPanel({ children, className = "", delay = 0 }: AnimatedPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: "easeOut" }}
      className={className}
      layout
    >
      {children}
    </motion.div>
  );
}

