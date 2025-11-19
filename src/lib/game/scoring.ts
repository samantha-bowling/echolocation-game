export interface ScoreComponents {
  base: number;
  proximityBonus: number;
  pingEfficiencyBonus: number;
  timeScore: number;
  perfectTargetBonus: number;
  chapterMechanicBonus: number;
  replayBonus: number;
}

export interface ScoreResult {
  total: number;
  components: ScoreComponents;
  rank: string;
}

const BASE_SCORE = 200;
export const PING_BONUS_PER_UNUSED = 50;
const PROXIMITY_POINTS_PER_PERCENT = 6;
const PING_EFFICIENCY_MAX = 400;
const PERFECT_TARGET_BONUS = 300;
const REPLAY_UNUSED_BONUS = 75;

// Chapter mechanic bonuses
const MECHANIC_BONUS_CH2_SHRINKING = 100; // Efficient guessing while target is large
const MECHANIC_BONUS_CH3_MOVING = 100; // Fast adaptation to movement
const MECHANIC_BONUS_CH4_PHANTOMS = 100; // Ping efficiency (not fooled by phantoms)
const MECHANIC_BONUS_CH5_COMBINED = 150; // Ultimate challenge completion

/**
 * Calculate unified time score
 * Positive for fast times (<15s), zero/minimal for average (15-40s), negative for slow (>40s)
 */
function calculateTimeScore(timeSeconds: number): number {
  if (timeSeconds < 15) {
    // Fast completion: +300 at 0s, scaling down to 0 at 15s
    return Math.round(((15 - timeSeconds) / 15) * 300);
  } else if (timeSeconds < 40) {
    // Average time: small penalty, -2 pts/s
    return -Math.round((timeSeconds - 15) * 2);
  } else {
    // Slow time: -50 base penalty, then -4 pts/s
    return -50 - Math.round((timeSeconds - 40) * 4);
  }
}

/**
 * Calculate chapter-specific mechanic bonus
 */
function calculateChapterMechanicBonus(
  chapter: number,
  proximity: number,
  pingEfficiency: number,
  timeSeconds: number
): number {
  switch (chapter) {
    case 2: // Shrinking Target - reward early/efficient guessing
      // Bonus if you maintain high accuracy with good ping efficiency
      return (proximity >= 85 && pingEfficiency >= 0.3) 
        ? MECHANIC_BONUS_CH2_SHRINKING 
        : 0;
    
    case 3: // Moving Target - reward fast adaptation
      // Bonus for quick completion (adapted to movement efficiently)
      return (timeSeconds <= 30 && proximity >= 80) 
        ? MECHANIC_BONUS_CH3_MOVING 
        : 0;
    
    case 4: // Phantom Targets - reward ping efficiency
      // Bonus for high ping efficiency (didn't waste pings on phantoms)
      return (pingEfficiency >= 0.4 && proximity >= 75) 
        ? MECHANIC_BONUS_CH4_PHANTOMS 
        : 0;
    
    case 5: // Combined Challenge - flat mastery bonus
      // Base bonus for facing all mechanics, plus extra for excellence
      const baseBonus = proximity >= 70 ? MECHANIC_BONUS_CH5_COMBINED : 0;
      const excellenceBonus = (proximity >= 90 && pingEfficiency >= 0.4) ? 50 : 0;
      return baseBonus + excellenceBonus;
    
    default: // Chapter 1 has no mechanic
      return 0;
  }
}

/**
 * Calculate round score
 */
export function calculateScore(
  proximity: number, // 0-100
  pingsUsed: number,
  totalPings: number,
  timeSeconds: number,
  chapter: number = 1,
  replaysUsed: number = 0,
  replaysAvailable?: number
): ScoreResult {
  const unusedPings = totalPings - pingsUsed;
  const pingEfficiency = unusedPings / totalPings;
  
  // Calculate individual components
  const proximityBonus = Math.round(proximity * PROXIMITY_POINTS_PER_PERCENT);
  const pingEfficiencyBonus = Math.round(pingEfficiency * PING_EFFICIENCY_MAX);
  const timeScore = calculateTimeScore(timeSeconds);
  
  // Perfect target bonus
  const perfectTargetBonus = proximity === 100 ? PERFECT_TARGET_BONUS : 0;
  
  // Chapter mechanic bonus
  const chapterMechanicBonus = calculateChapterMechanicBonus(
    chapter,
    proximity,
    pingEfficiency,
    timeSeconds
  );
  
  // Replay bonus - reward players who don't use all available replays (only if replays were limited)
  let replayBonus = 0;
  if (replaysAvailable !== undefined && replaysAvailable > 0) {
    const replaysUnused = replaysAvailable - replaysUsed;
    if (replaysUnused > 0) {
      replayBonus = replaysUnused * REPLAY_UNUSED_BONUS;
    }
  }
  
  // Calculate final total
  const finalScore = 
    BASE_SCORE + 
    proximityBonus + 
    pingEfficiencyBonus + 
    timeScore + 
    perfectTargetBonus + 
    chapterMechanicBonus + 
    replayBonus;
  
  return {
    total: Math.max(0, finalScore),
    components: {
      base: BASE_SCORE,
      proximityBonus,
      pingEfficiencyBonus,
      timeScore,
      perfectTargetBonus,
      chapterMechanicBonus,
      replayBonus,
    },
    rank: getRank(Math.max(0, finalScore)),
  };
}

export interface RankInfo {
  rank: string;
  threshold: number;
}

export const RANK_THRESHOLDS: RankInfo[] = [
  { rank: 'SS', threshold: 2400 },
  { rank: 'S+', threshold: 2100 },
  { rank: 'S', threshold: 1800 },
  { rank: 'A+', threshold: 1500 },
  { rank: 'A', threshold: 1200 },
  { rank: 'B+', threshold: 1000 },
  { rank: 'B', threshold: 800 },
  { rank: 'C', threshold: 500 },
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
 * Check if player can progress to next level
 * Requires B rank or better (800+ points)
 */
export function canProgressToNextLevel(rank: string, isBossLevel: boolean = false): boolean {
  if (isBossLevel) {
    // Boss levels (Level 10) require A rank or better
    const bossProgressionRanks = ['SS', 'S+', 'S', 'A+', 'A'];
    return bossProgressionRanks.includes(rank);
  }
  
  // Regular levels require B rank or better
  const progressionRanks = ['SS', 'S+', 'S', 'A+', 'A', 'B+', 'B'];
  return progressionRanks.includes(rank);
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
    tips.push("Save pings! Higher efficiency means better score");
  }
  
  // Time tips - updated for unified time score
  if (timeElapsed > 40) {
    tips.push("Work faster! Time over 40s incurs significant penalties");
  } else if (timeElapsed > 15 && timeElapsed < 20) {
    tips.push("Complete in under 15 seconds to earn time bonus points!");
  }
  
  // Speed bonus opportunity
  if (timeElapsed >= 15 && score.components.timeScore <= 0) {
    tips.push("Aim for under 15 seconds to earn up to +300 time bonus!");
  }
  
  // Perfect target opportunity
  if (proximity >= 95 && proximity < 100) {
    tips.push(`So close to 100% for the Perfect Target bonus (+${PERFECT_TARGET_BONUS} pts)!`);
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
  
  // Time score: 0 if timer disabled
  const timeScore = timerEnabled ? calculateTimeScore(timeSeconds) : 0;
  
  // Perfect target bonus
  const perfectTargetBonus = proximity === 100 ? PERFECT_TARGET_BONUS : 0;
  
  // Calculate total (no chapter mechanic bonus for custom games)
  const total = Math.max(
    0,
    BASE_SCORE + 
      proximityBonus + 
      pingEfficiencyBonus + 
      timeScore + 
      perfectTargetBonus
  );
  
  return {
    total,
    components: {
      base: BASE_SCORE,
      proximityBonus,
      pingEfficiencyBonus,
      timeScore,
      perfectTargetBonus,
      chapterMechanicBonus: 0, // No mechanic bonus in custom games
      replayBonus: 0,
    },
    rank: getRank(total),
  };
}

/**
 * Check win condition for custom games
 */
export function checkWinCondition(
  proximity: number,
  pingsUsed: number,
  timeSeconds: number,
  totalScore: number,
  winCondition?: {
    type: 'proximity' | 'pings' | 'time' | 'score';
    proximityThreshold?: number;
    maxPings?: number;
    maxTime?: number;
    minScore?: number;
  }
): boolean {
  if (!winCondition) return true;

  switch (winCondition.type) {
    case 'proximity':
      return proximity >= (winCondition.proximityThreshold || 80);
    case 'pings':
      return pingsUsed <= (winCondition.maxPings || 5);
    case 'time':
      return timeSeconds <= (winCondition.maxTime || 30);
    case 'score':
      return totalScore >= (winCondition.minScore || 1000);
    default:
      return true;
  }
}
