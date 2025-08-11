'use client';

import { useState, useEffect } from 'react';
import { useBasketEvents } from '@/lib/hooks/useBasketEvents';
import { motion, AnimatePresence } from 'framer-motion';

interface EvolutionState {
  rawDumps: any[];
  blocks: any[];
  narrative: any | null;
  threads: any[];
}

export function SubstrateEvolution({ basketId }: { basketId: string }) {
  const { lastEvent } = useBasketEvents(basketId);
  const [evolution, setEvolution] = useState<EvolutionState>({
    rawDumps: [],
    blocks: [],
    narrative: null,
    threads: [],
  });

  useEffect(() => {
    if (!lastEvent) return;
    switch (lastEvent.type) {
      case 'raw_dump:created':
        setEvolution((prev) => ({
          ...prev,
          rawDumps: [...prev.rawDumps, lastEvent.payload],
        }));
        break;
      case 'block:created':
        setEvolution((prev) => ({
          ...prev,
          blocks: [...prev.blocks, lastEvent.payload],
        }));
        break;
      case 'narrative:generated':
        setEvolution((prev) => ({
          ...prev,
          narrative: lastEvent.payload,
        }));
        break;
    }
  }, [lastEvent]);

  return (
    <div className="p-8 space-y-6">
      <AnimatePresence>
        {evolution.rawDumps.map((dump, i) => (
          <motion.div
            key={dump.id || i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="text-gray-600 text-sm"
          >
            ↓ Capturing {dump.type}...
          </motion.div>
        ))}

        {evolution.blocks.map((block, i) => (
          <motion.div
            key={block.id || i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.2 }}
            className="bg-gray-900 rounded p-4 border border-gray-800"
          >
            <div className="text-xs text-gray-500 mb-1">Memory Block</div>
            <div className="text-white">{(block.content || '').slice(0, 100)}...</div>
          </motion.div>
        ))}

        {evolution.narrative && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-blue-400 italic"
          >
            ✨ Weaving narrative...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

