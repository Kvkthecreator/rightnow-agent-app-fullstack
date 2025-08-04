"use client";

import { motion } from "framer-motion";

interface OrganicSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const OrganicSpinner = ({ size = "md", className = "" }: OrganicSpinnerProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20", 
    lg: "w-32 h-32",
    xl: "w-48 h-48"
  };

  const paths = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    d: `
      M ${50 - i * 2},${50 - i * 10}
      C ${30 + i * 2},${30 + i * 4} ${70 - i * 4},${70 - i * 2} ${50 + i * 2},${50 + i * 10}
    `,
    opacity: 0.2 + i * 0.1,
    strokeWidth: 0.8 + i * 0.3,
    delay: i * 0.3,
  }));

  return (
    <div className={`relative ${sizeClasses[size]} text-[#0F172A] dark:text-white ${className}`}>
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={path.opacity}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{
              duration: 2.5,
              delay: path.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.svg>
    </div>
  );
};

export default OrganicSpinner;