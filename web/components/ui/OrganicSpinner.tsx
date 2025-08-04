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

  // Many flowing yarn strands to fill the entire circular view
  const yarnStrands = Array.from({ length: 16 }, (_, i) => {
    const yOffset = (i * 8) - 20; // Distribute vertically across the view
    const xVariation = (i % 3) * 10; // Slight horizontal variations
    const waveHeight = 15 + (i % 4) * 5; // Varying wave amplitudes
    
    return {
      id: i,
      d: `M ${-10 + xVariation},${35 + yOffset} C ${15 + xVariation},${35 + yOffset - waveHeight} ${35 + xVariation},${35 + yOffset + waveHeight} ${50 + xVariation},${35 + yOffset} C ${65 + xVariation},${35 + yOffset - waveHeight} ${85 + xVariation},${35 + yOffset + waveHeight} ${110 + xVariation},${35 + yOffset}`,
      delay: i * 0.15,
      strokeWidth: 2.8 - (i % 5) * 0.3,
      opacity: 0.8 - (i % 6) * 0.08
    };
  });

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Circular mask/container */}
      <div className="w-full h-full rounded-full overflow-hidden bg-white">
        <motion.svg
          viewBox="0 0 120 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {yarnStrands.map((strand) => (
            <motion.path
              key={strand.id}
              d={strand.d}
              stroke="#FF5722"
              strokeWidth={strand.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={strand.opacity}
              fill="none"
              initial={{ pathLength: 0, x: -40 }}
              animate={{ 
                pathLength: [0, 1, 1, 0],
                x: [-40, 0, 0, 40]
              }}
              transition={{
                pathLength: {
                  duration: 3 + (strand.id % 3) * 0.3,
                  delay: strand.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.3, 0.7, 1]
                },
                x: {
                  duration: 4 + (strand.id % 4) * 0.2,
                  delay: strand.delay,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            />
          ))}
          
          {/* Additional flowing waves for extra density */}
          {Array.from({ length: 8 }, (_, i) => (
            <motion.path
              key={`extra-${i}`}
              d={`M ${5 + i * 15},${20 + i * 12} C ${25 + i * 15},${40 + i * 12} ${45 + i * 15},${10 + i * 12} ${85 + i * 15},${30 + i * 12}`}
              stroke="#FF5722"
              strokeWidth={1.8 - (i % 3) * 0.2}
              strokeLinecap="round"
              strokeOpacity={0.4 - i * 0.03}
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0] }}
              transition={{
                duration: 4 + i * 0.3,
                delay: 2 + i * 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.svg>
      </div>
    </div>
  );
};

export default OrganicSpinner;