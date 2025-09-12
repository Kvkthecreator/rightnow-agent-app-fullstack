/**
 * Basket Maturity System - Dynamic substrate lifecycle management
 * 
 * Calculates basket maturity based on substrate density and variety
 * Uses configurable thresholds for easy adjustment as service hardens
 */

// Dynamic configuration - easy to adjust without hard-coding
const MATURITY_CONFIG = {
  // Substrate count thresholds for level progression
  THRESHOLDS: {
    SEEDLING: 10,    // Level 1 → 2: Early exploration
    GROWING: 50,     // Level 2 → 3: Active development  
    MATURE: 200      // Level 3 → 4: Rich knowledge base
  },
  
  // Variety bonus - encourages substrate diversity
  VARIETY_MULTIPLIER: 1.2,
  
  // Minimum substrate types for variety bonus
  MIN_VARIETY_TYPES: 3
};

export interface BasketStats {
  blocks_count: number;
  raw_dumps_count: number;
  context_items_count: number;
  timeline_events_count: number;
  documents_count: number;
}

export interface BasketMaturity {
  level: 1 | 2 | 3 | 4;
  score: number;
  phase: 'embryonic' | 'seedling' | 'growing' | 'mature';
  substrateDensity: number;
  varietyBonus: boolean;
  nextLevelAt?: number;
  progressPercent: number;
}

/**
 * Calculate basket maturity from substrate statistics
 * Uses dynamic scoring system with variety bonuses
 */
export function calculateMaturity(stats: BasketStats): BasketMaturity {
  const { blocks_count, raw_dumps_count, context_items_count, timeline_events_count } = stats;
  
  // Core substrate density
  const substrateDensity = blocks_count + raw_dumps_count + context_items_count + timeline_events_count;
  
  // Variety calculation - bonus for substrate diversity
  const substrateTypes = [
    blocks_count > 0,
    raw_dumps_count > 0, 
    context_items_count > 0,
    timeline_events_count > 0
  ].filter(Boolean).length;
  
  const varietyBonus = substrateTypes >= MATURITY_CONFIG.MIN_VARIETY_TYPES;
  const varietyMultiplier = varietyBonus ? MATURITY_CONFIG.VARIETY_MULTIPLIER : 1.0;
  
  // Final maturity score with variety bonus
  const score = Math.floor(substrateDensity * varietyMultiplier);
  
  // Determine maturity level and phase
  let level: BasketMaturity['level'];
  let phase: BasketMaturity['phase'];
  let nextLevelAt: number | undefined;
  let progressPercent: number;
  
  if (score < MATURITY_CONFIG.THRESHOLDS.SEEDLING) {
    level = 1;
    phase = 'embryonic';
    nextLevelAt = MATURITY_CONFIG.THRESHOLDS.SEEDLING;
    progressPercent = Math.min(95, (score / MATURITY_CONFIG.THRESHOLDS.SEEDLING) * 100);
  } else if (score < MATURITY_CONFIG.THRESHOLDS.GROWING) {
    level = 2;
    phase = 'seedling';
    nextLevelAt = MATURITY_CONFIG.THRESHOLDS.GROWING;
    const rangeSize = MATURITY_CONFIG.THRESHOLDS.GROWING - MATURITY_CONFIG.THRESHOLDS.SEEDLING;
    const currentInRange = score - MATURITY_CONFIG.THRESHOLDS.SEEDLING;
    progressPercent = Math.min(95, (currentInRange / rangeSize) * 100);
  } else if (score < MATURITY_CONFIG.THRESHOLDS.MATURE) {
    level = 3;
    phase = 'growing';
    nextLevelAt = MATURITY_CONFIG.THRESHOLDS.MATURE;
    const rangeSize = MATURITY_CONFIG.THRESHOLDS.MATURE - MATURITY_CONFIG.THRESHOLDS.GROWING;
    const currentInRange = score - MATURITY_CONFIG.THRESHOLDS.GROWING;
    progressPercent = Math.min(95, (currentInRange / rangeSize) * 100);
  } else {
    level = 4;
    phase = 'mature';
    nextLevelAt = undefined;
    progressPercent = 100;
  }
  
  return {
    level,
    score,
    phase,
    substrateDensity,
    varietyBonus,
    nextLevelAt,
    progressPercent
  };
}

/**
 * Get adaptive content guidance based on maturity level
 */
export function getMaturityGuidance(maturity: BasketMaturity): {
  memoryInsightsMessage: string;
  documentEditGuidance: string;
  nextSteps: string[];
} {
  switch (maturity.level) {
    case 1: // Embryonic
      return {
        memoryInsightsMessage: `Add ${maturity.nextLevelAt! - maturity.score} more memories to unlock pattern detection`,
        documentEditGuidance: "Start by capturing your thoughts and connecting key memories",
        nextSteps: [
          "Upload documents or add raw content",
          "Create structured knowledge blocks", 
          "Add contextual items to build foundation"
        ]
      };
      
    case 2: // Seedling  
      return {
        memoryInsightsMessage: `${maturity.nextLevelAt! - maturity.score} more memories needed for deeper insights`,
        documentEditGuidance: "Focus on connecting ideas and building knowledge relationships",
        nextSteps: [
          "Link related memories in documents",
          "Add timeline events for temporal context",
          maturity.varietyBonus ? "Continue building substrate variety" : "Diversify substrate types for bonus progress"
        ]
      };
      
    case 3: // Growing
      return {
        memoryInsightsMessage: `Rich insights emerging - ${maturity.nextLevelAt! - maturity.score} memories to full maturity`,
        documentEditGuidance: "Leverage AI composition and deep substrate connections",
        nextSteps: [
          "Use AI-assisted composition features",
          "Create complex multi-substrate documents",
          "Focus on knowledge synthesis and integration"
        ]
      };
      
    case 4: // Mature
      return {
        memoryInsightsMessage: "Mature knowledge ecosystem with rich insights and patterns",
        documentEditGuidance: "Full feature access - advanced composition and deep substrate linking",
        nextSteps: [
          "Export and share knowledge artifacts",
          "Maintain and refine existing knowledge",
          "Explore advanced analytical features"
        ]
      };
  }
}

/**
 * Update maturity configuration (for admin/development use)
 */
export function updateMaturityConfig(newConfig: Partial<typeof MATURITY_CONFIG>) {
  Object.assign(MATURITY_CONFIG, newConfig);
}