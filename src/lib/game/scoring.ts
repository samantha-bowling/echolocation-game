export interface ScoreComponents {
  base: number;
  proximityBonus: number;
  pingEfficiencyBonus: number;
  timePenalty: number;
  speedBonus: number;
  perfectTargetBonus: number;
  difficultyMultiplier: number;
  boonBonus: number;
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
  
  // Calculate pre-multiplier total
  const preMultiplierTotal = Math.max(
    0,
    BASE_SCORE +
    proximityBonus +
    pingEfficiencyBonus +
    speedBonus +
    perfectTargetBonus +
    boonBonus -
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
