"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import clsx from "clsx";

const MotionImage = motion(Image);

interface YarnSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-40 h-40",
};

export default function YarnSpinner({
  size = "md",
  className = "",
}: YarnSpinnerProps) {
  const prefersReducedMotion = useReducedMotion();

  // 0 → +720° → 0 → -720° → 0 (repeat)
  const rotateKeyframes = [0, 720, 0, -720, 0];

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <MotionImage
        src="/assets/logos/circleonly_yarnnn.png"
        alt="Yarnnn Loading"
        fill
        sizes="100vw"
        priority
        draggable={false}
        className="object-contain select-none"
        style={{ 
          transformOrigin: "50% 50%",
          background: "transparent"
        }}
        animate={prefersReducedMotion ? undefined : { rotate: rotateKeyframes }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 10, // chill
                ease: "easeInOut",
                times: [0, 0.25, 0.5, 0.75, 1],
                repeat: Infinity,
              }
        }
      />
    </div>
  );
}
