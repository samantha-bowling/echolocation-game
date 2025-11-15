export interface ScoreComponents {
  base: number;
  proximityBonus: number;
  unusedPingBonus: number;
  timePenalty: number;
  boonBonus: number;
}

export interface ScoreResult {
  total: number;
  components: ScoreComponents;
  rank: string;
}

const BASE_SCORE = 1000;
const PING_BONUS_PER_UNUSED = 50;
const PROXIMITY_MULTIPLIER = 5;
const TIME_PENALTY_PER_SECOND = 2;

/**
 * Calculate round score
 */
export function calculateScore(
  proximity: number, // 0-100
  pingsUsed: number,
  totalPings: number,
  timeSeconds: number,
  activeBoons: string[] = []
): ScoreResult {
  const unusedPings = totalPings - pingsUsed;
  
  const components: ScoreComponents = {
    base: BASE_SCORE,
    proximityBonus: Math.round(proximity * PROXIMITY_MULTIPLIER),
    unusedPingBonus: unusedPings * PING_BONUS_PER_UNUSED,
    timePenalty: Math.round(timeSeconds * TIME_PENALTY_PER_SECOND),
    boonBonus: activeBoons.length * 25,
  };
  
  const total = Math.max(
    0,
    components.base +
    components.proximityBonus +
    components.unusedPingBonus +
    components.boonBonus -
    components.timePenalty
  );
  
  return {
    total,
    components,
    rank: getRank(total),
  };
}

/**
 * Get rank based on score
 */
export function getRank(score: number): string {
  if (score >= 2000) return 'S';
  if (score >= 1750) return 'A+';
  if (score >= 1500) return 'A';
  if (score >= 1250) return 'B+';
  if (score >= 1000) return 'B';
  if (score >= 750) return 'C';
  return 'D';
}

/**
 * Get flavor text for rank
 */
export function getRankFlavor(rank: string): string {
  const flavors: Record<string, string[]> = {
    'S': ['Perfect Echo!', 'Sonar Master', 'Flawless Navigation'],
    'A+': ['Excellent Precision', 'Sharp Hearing', 'Nearly Perfect'],
    'A': ['Great Work', 'Strong Signal', 'Well Done'],
    'B+': ['Good Job', 'Solid Ping', 'Getting Close'],
    'B': ['Not Bad', 'Decent Echo', 'Keep Practicing'],
    'C': ['Room for Improvement', 'Faint Signal', 'Try Again'],
    'D': ['Needs Work', 'Lost Signal', 'Better Luck Next Time'],
  };
  
  const options = flavors[rank] || ['Keep Going'];
  return options[Math.floor(Math.random() * options.length)];
}
