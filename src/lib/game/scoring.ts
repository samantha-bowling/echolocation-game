export interface ScoreComponents {
  base: number;
  proximityBonus: number;
  pingEfficiencyBonus: number;
  timePenalty: number;
  speedBonus: number;
  perfectTargetBonus: number;
  difficultyMultiplier: number;
  boonBonus: number;
  earlyGuessBonus: number;
}

export interface ScoreResult {
  total: number;
  components: ScoreComponents;
  rank: string;
}

const BASE_SCORE = 1000;
export const PING_BONUS_PER_UNUSED = 50;
const PROXIMITY_POINTS_PER_PERCENT = 4;
const PING_EFFICIENCY_MAX = 300;
const TIME_PENALTY_PER_SECOND = 2;
const MAX_TIME_PENALTY = 500;
const SPEED_BONUS_THRESHOLD = 15;
const SPEED_BONUS_MAX = 250;
const PERFECT_TARGET_BONUS = 200;
const EARLY_GUESS_BONUS_PER_PING = 75;

/**
 * Get difficulty multiplier
 */
function getDifficultyMultiplier(difficulty: 'easy' | 'medium' | 'hard'): number {
  const multipliers = {
    easy: 1.0,
    medium: 1.2,
    hard: 1.5,
  };
  return multipliers[difficulty];
}

/**
 * Calculate round score
 */
export function calculateScore(
  proximity: number, // 0-100
  pingsUsed: number,
  totalPings: number,
  timeSeconds: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  activeBoons: string[] = []
): ScoreResult {
  const unusedPings = totalPings - pingsUsed;
  const pingEfficiency = unusedPings / totalPings;
  
  // Calculate individual components
  const proximityBonus = Math.round(proximity * PROXIMITY_POINTS_PER_PERCENT);
  const pingEfficiencyBonus = Math.round(pingEfficiency * PING_EFFICIENCY_MAX);
  const timePenalty = Math.min(MAX_TIME_PENALTY, Math.round(timeSeconds * TIME_PENALTY_PER_SECOND));
  
  // Speed bonus: max points if completed very quickly
  const speedBonus = timeSeconds < SPEED_BONUS_THRESHOLD
    ? Math.round(((SPEED_BONUS_THRESHOLD - timeSeconds) / SPEED_BONUS_THRESHOLD) * SPEED_BONUS_MAX)
    : 0;
  
  // Perfect target bonus
  const perfectTargetBonus = proximity === 100 ? PERFECT_TARGET_BONUS : 0;
  
  // Boon bonus
  const boonBonus = activeBoons.length * 25;
  
  // Early guess bonus - reward players who guess without using all pings
  const earlyGuessBonus = unusedPings > 0 
    ? Math.round(unusedPings * EARLY_GUESS_BONUS_PER_PING)
    : 0;
  
  // Calculate pre-multiplier total
  const preMultiplierTotal = Math.max(
    0,
    BASE_SCORE +
    proximityBonus +
    pingEfficiencyBonus +
    speedBonus +
    perfectTargetBonus +
    boonBonus +
    earlyGuessBonus -
    timePenalty
  );
  
  // Apply difficulty multiplier
  const difficultyMultiplier = getDifficultyMultiplier(difficulty);
  const total = Math.round(preMultiplierTotal * difficultyMultiplier);
  
  const components: ScoreComponents = {
    base: BASE_SCORE,
    proximityBonus,
    pingEfficiencyBonus,
    timePenalty,
    speedBonus,
    perfectTargetBonus,
    difficultyMultiplier,
    boonBonus,
    earlyGuessBonus,
  };
  
  return {
    total,
    components,
    rank: getRank(total),
  };
}

export interface RankInfo {
  rank: string;
  threshold: number;
}

export const RANK_THRESHOLDS: RankInfo[] = [
  { rank: 'SS', threshold: 2800 },
  { rank: 'S+', threshold: 2600 },
  { rank: 'S', threshold: 2400 },
  { rank: 'A+', threshold: 2000 },
  { rank: 'A', threshold: 1700 },
  { rank: 'B+', threshold: 1400 },
  { rank: 'B', threshold: 1100 },
  { rank: 'C', threshold: 800 },
  { rank: 'D', threshold: 0 },
];

/**
 * Get rank based on score
 */
export function getRank(score: number): string {
  for (const { rank, threshold } of RANK_THRESHOLDS) {
    if (score >= threshold) return rank;
  }
  return 'D';
}

/**
 * Get color classes for rank display
 */
export function getRankColor(rank: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (rank) {
    case 'SS':
      return {
        bg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
        text: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400',
        border: 'border-purple-500/40',
      };
    case 'S+':
      return {
        bg: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
        text: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400',
        border: 'border-yellow-500/40',
      };
    case 'S':
      return {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-400',
        border: 'border-yellow-500/30',
      };
    case 'A+':
    case 'A':
      return {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        border: 'border-green-500/30',
      };
    case 'B+':
    case 'B':
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
      };
    case 'C':
      return {
        bg: 'bg-orange-500/20',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
      };
    case 'D':
    default:
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/30',
      };
  }
}

/**
 * Get next rank info
 */
export function getNextRankInfo(currentRank: string): RankInfo | null {
  const currentIndex = RANK_THRESHOLDS.findIndex(r => r.rank === currentRank);
  return currentIndex > 0 ? RANK_THRESHOLDS[currentIndex - 1] : null;
}

/**
 * Get points needed to reach next rank
 */
export function getPointsToNextRank(score: number, currentRank: string): number {
  const nextRank = getNextRankInfo(currentRank);
  return nextRank ? Math.max(0, nextRank.threshold - score) : 0;
}

/**
 * Get progress percentage to next rank
 */
export function getProgressToNextRank(score: number, currentRank: string): number {
  const currentThreshold = RANK_THRESHOLDS.find(r => r.rank === currentRank)?.threshold ?? 0;
  const nextRank = getNextRankInfo(currentRank);
  
  if (!nextRank) return 100; // Already at max rank
  
  const range = nextRank.threshold - currentThreshold;
  const progress = score - currentThreshold;
  return Math.min(100, Math.max(0, (progress / range) * 100));
}

/**
 * Get flavor text for rank
 */
export function getRankFlavor(rank: string): string {
  const flavors: Record<string, string[]> = {
    'SS': [
      'LEGENDARY! You are a master of the echoes!',
      'TRANSCENDENT! The echoes bow to your skill!',
      'MYTHICAL! You\'ve achieved perfection!',
      'GODLIKE! Unmatched precision and strategy!',
    ],
    'S+': [
      'EXCEPTIONAL! Near-perfect execution!',
      'PHENOMENAL! Elite-tier performance!',
      'OUTSTANDING! You\'ve mastered the game!',
      'SPECTACULAR! Almost legendary!',
    ],
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

/**
 * Generate strategic tips based on performance
 */
export function generateStrategicTips(
  score: ScoreResult,
  proximity: number,
  pingsUsed: number,
  totalPings: number,
  timeElapsed: number
): string[] {
  const tips: string[] = [];
  
  // Proximity tips
  if (proximity < 85) {
    tips.push("Use pings to triangulate the target's position more precisely");
  }
  
  // Ping efficiency tips
  const pingEfficiency = ((totalPings - pingsUsed) / totalPings) * 100;
  if (pingEfficiency < 20) {
    tips.push(`Save pings! Each unused ping is worth ${PING_BONUS_PER_UNUSED} points`);
  }
  
  // Time tips
  if (timeElapsed > 30) {
    tips.push("Work faster to reduce time penalty (you lose 2 points per second)");
  } else if (timeElapsed > 15 && timeElapsed < 20) {
    tips.push("You're close to the speed bonus threshold (under 15 seconds)!");
  }
  
  // Speed bonus opportunity
  if (timeElapsed >= 15 && score.components.speedBonus === 0) {
    tips.push("Complete in under 15 seconds to earn a speed bonus!");
  }
  
  // Perfect target opportunity
  if (proximity >= 95 && proximity < 100) {
    tips.push("So close to 100% for the Perfect Target bonus (+200 pts)!");
  }
  
  return tips.slice(0, 2); // Show max 2 tips
}

/**
 * Calculate score for custom games with config adjustments
 */
export function calculateCustomScore(
  proximity: number,
  pingsUsed: number,
  totalPings: number | typeof Infinity,
  timeSeconds: number,
  timerEnabled: boolean
): ScoreResult {
  const unusedPings = totalPings === Infinity ? 0 : totalPings - pingsUsed;
  const pingEfficiency = totalPings === Infinity ? 0 : unusedPings / (totalPings as number);
  
  // Calculate components
  const proximityBonus = Math.round(proximity * PROXIMITY_POINTS_PER_PERCENT);
  
  // Ping efficiency: 0 if unlimited
  const pingEfficiencyBonus = totalPings === Infinity 
    ? 0 
    : Math.round(pingEfficiency * PING_EFFICIENCY_MAX);
  
  // Time penalty: 0 if timer disabled
  const timePenalty = timerEnabled
    ? Math.min(MAX_TIME_PENALTY, Math.round(timeSeconds * TIME_PENALTY_PER_SECOND))
    : 0;
  
  // Speed bonus: 0 if timer disabled
  const speedBonus = timerEnabled && timeSeconds < SPEED_BONUS_THRESHOLD
    ? Math.round(((SPEED_BONUS_THRESHOLD - timeSeconds) / SPEED_BONUS_THRESHOLD) * SPEED_BONUS_MAX)
    : 0;
  
  // Perfect target bonus
  const perfectTargetBonus = proximity === 100 ? PERFECT_TARGET_BONUS : 0;
  
  // Early guess bonus
  const earlyGuessBonus = totalPings !== Infinity && unusedPings > 0
    ? Math.round(unusedPings * EARLY_GUESS_BONUS_PER_PING)
    : 0;
  
  // Calculate total (no difficulty multiplier for custom games)
  const total = Math.max(
    0,
    BASE_SCORE +
    proximityBonus +
    pingEfficiencyBonus +
    speedBonus +
    perfectTargetBonus +
    earlyGuessBonus -
    timePenalty
  );
  
  const components: ScoreComponents = {
    base: BASE_SCORE,
    proximityBonus,
    pingEfficiencyBonus,
    timePenalty,
    speedBonus,
    perfectTargetBonus,
    difficultyMultiplier: 1.0, // No multiplier for custom
    boonBonus: 0,
    earlyGuessBonus,
  };
  
  return {
    total,
    components,
    rank: getRank(total),
  };
}

/**
 * Check if player met the win condition
 */
export function checkWinCondition(
  proximity: number,
  winCondition?: { type: 'none' | 'proximity'; proximityThreshold?: number }
): boolean {
  if (!winCondition || winCondition.type === 'none') {
    return true; // Free play - always pass
  }
  
  if (winCondition.type === 'proximity') {
    return proximity >= (winCondition.proximityThreshold || 80);
  }
  
  return true;
}
