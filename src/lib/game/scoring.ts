export interface ScoreComponents {
  base: number;
  proximityBonus: number;
  pingEfficiencyBonus: number;
  timeScore: number;
  perfectTargetBonus: number;
  chapterMechanicBonus: number;
  replayBonus: number;
  hintPenalty: number;
}

export interface ScoreResult {
  total: number;
  components: ScoreComponents;
  rank: string;
}

const BASE_SCORE = 0;
export const PING_BONUS_PER_UNUSED = 50;
const PROXIMITY_POINTS_PER_PERCENT = 5;
const PING_EFFICIENCY_MAX = 200;
const PERFECT_TARGET_BONUS = 300;
const REPLAY_UNUSED_BONUS = 75;
const HINT_PENALTY = -100; // Penalty for using hints (Chapters 2-5 only)

// Chapter mechanic bonuses
const MECHANIC_BONUS_CH2_SHRINKING = 100; // Efficient guessing while target is large
const MECHANIC_BONUS_CH3_MOVING = 100; // Fast adaptation to movement
const MECHANIC_BONUS_CH4_PHANTOMS = 100; // Ping efficiency (not fooled by phantoms)
const MECHANIC_BONUS_CH5_COMBINED = 150; // Ultimate challenge completion

/**
 * Calculate unified time score
 * Positive for fast times (<15s), neutral zone (15-45s), negative for slow (>45s)
 */
function calculateTimeScore(timeSeconds: number): number {
  if (timeSeconds < 15) {
    // Fast completion: +300 at 0s, scaling down to 0 at 15s
    return Math.round(((15 - timeSeconds) / 15) * 300);
  } else if (timeSeconds <= 45) {
    // Neutral zone: no penalty or bonus for average times
    return 0;
  } else {
    // Slow time: -4 pts per second over 45s
    return -Math.round((timeSeconds - 45) * 4);
  }
}

/**
 * Calculate chapter-specific mechanic bonus with difficulty awareness
 */
function calculateChapterMechanicBonus(
  chapter: number,
  proximity: number,
  pingEfficiency: number,
  timeSeconds: number,
  difficulty: 'normal' | 'challenge' = 'normal'
): number {
  switch (chapter) {
    case 2: // Shrinking Target
      if (difficulty === 'normal') {
        // Normal: reward high accuracy regardless of time
        return (proximity >= 90) ? MECHANIC_BONUS_CH2_SHRINKING : 0;
      } else {
        // Challenge: reward early/efficient guessing (original logic)
        return (proximity >= 85 && pingEfficiency >= 0.3) 
          ? MECHANIC_BONUS_CH2_SHRINKING 
          : 0;
      }
    
    case 3: // Moving Target
      if (difficulty === 'normal') {
        // Normal: reward ping efficiency (adapted without time pressure)
        return (proximity >= 80 && pingEfficiency >= 0.3) 
          ? MECHANIC_BONUS_CH3_MOVING 
          : 0;
      } else {
        // Challenge: reward fast adaptation (original logic)
        return (timeSeconds <= 30 && proximity >= 80) 
          ? MECHANIC_BONUS_CH3_MOVING 
          : 0;
      }
    
    case 4: // Phantom Targets
      // Same for both: reward ping efficiency (not time-dependent)
      return (pingEfficiency >= 0.4 && proximity >= 75) 
        ? MECHANIC_BONUS_CH4_PHANTOMS 
        : 0;
    
    case 5: // Combined Challenge
      if (difficulty === 'normal') {
        // Normal: flat mastery bonus based on accuracy
        return (proximity >= 85 && pingEfficiency >= 0.3) 
          ? MECHANIC_BONUS_CH5_COMBINED 
          : 0;
      } else {
        // Challenge: original logic with excellence bonus
        const baseBonus = proximity >= 70 ? MECHANIC_BONUS_CH5_COMBINED : 0;
        const excellenceBonus = (proximity >= 90 && pingEfficiency >= 0.4) ? 50 : 0;
        return baseBonus + excellenceBonus;
      }
    
    default: // Chapter 1 has no mechanic
      return 0;
  }
}

/**
 * Calculate round score with difficulty-specific logic
 */
export function calculateScore(
  proximity: number, // 0-100
  pingsUsed: number,
  totalPings: number,
  timeSeconds: number,
  chapter: number = 1,
  replaysUsed: number = 0,
  replaysAvailable?: number,
  hintUsed: boolean = false,
  difficulty: 'normal' | 'challenge' = 'normal'
): ScoreResult {
  const unusedPings = totalPings - pingsUsed;
  const pingEfficiency = unusedPings / totalPings;
  
  // Calculate individual components
  const proximityBonus = Math.round(proximity * PROXIMITY_POINTS_PER_PERCENT);
  const pingEfficiencyBonus = Math.round(pingEfficiency * PING_EFFICIENCY_MAX);
  
  // Time score - ONLY for Challenge mode
  const timeScore = difficulty === 'challenge' ? calculateTimeScore(timeSeconds) : 0;
  
  // Perfect target bonus
  const perfectTargetBonus = proximity === 100 ? PERFECT_TARGET_BONUS : 0;
  
  // Chapter mechanic bonus (difficulty-aware)
  const chapterMechanicBonus = calculateChapterMechanicBonus(
    chapter,
    proximity,
    pingEfficiency,
    timeSeconds,
    difficulty
  );
  
  // Replay bonus - reward players who don't use all available replays (only if replays were limited)
  let replayBonus = 0;
  if (replaysAvailable !== undefined && replaysAvailable > 0) {
    const replaysUnused = replaysAvailable - replaysUsed;
    if (replaysUnused > 0) {
      replayBonus = replaysUnused * REPLAY_UNUSED_BONUS;
    }
  }

  // Hint penalty (Chapters 2-5 only)
  let hintPenalty = 0;
  if (hintUsed && chapter > 1) {
    hintPenalty = HINT_PENALTY;
  }
  
  // Calculate final total
  const finalScore = 
    BASE_SCORE + 
    proximityBonus + 
    pingEfficiencyBonus + 
    timeScore + 
    perfectTargetBonus + 
    chapterMechanicBonus + 
    replayBonus +
    hintPenalty;
  
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
      hintPenalty,
    },
    rank: getRank(Math.max(0, finalScore), difficulty),
  };
}

export interface RankInfo {
  rank: string;
  threshold: number;
}

// Normal Mode Rank Thresholds (lower due to no time score)
export const RANK_THRESHOLDS_NORMAL: RankInfo[] = [
  { rank: 'SS', threshold: 950 },
  { rank: 'S+', threshold: 875 },
  { rank: 'S', threshold: 825 },
  { rank: 'S-', threshold: 775 },
  { rank: 'A+', threshold: 725 },
  { rank: 'A', threshold: 650 },    // Boss level requirement
  { rank: 'A-', threshold: 600 },   // Progression threshold
  { rank: 'B+', threshold: 550 },
  { rank: 'B', threshold: 500 },
  { rank: 'C+', threshold: 450 },
  { rank: 'C', threshold: 375 },
  { rank: 'C-', threshold: 300 },
  { rank: 'D', threshold: 0 },
];

// Challenge Mode Rank Thresholds (higher due to time score bonus potential)
export const RANK_THRESHOLDS_CHALLENGE: RankInfo[] = [
  { rank: 'SS', threshold: 950 },
  { rank: 'S+', threshold: 875 },
  { rank: 'S', threshold: 825 },
  { rank: 'S-', threshold: 775 },
  { rank: 'A+', threshold: 725 },
  { rank: 'A', threshold: 650 },    // Boss level requirement
  { rank: 'A-', threshold: 600 },
  { rank: 'B+', threshold: 550 },
  { rank: 'B', threshold: 500 },    // Progression threshold
  { rank: 'C+', threshold: 450 },
  { rank: 'C', threshold: 375 },
  { rank: 'C-', threshold: 300 },
  { rank: 'D', threshold: 0 },
];

// Legacy export for backwards compatibility
export const RANK_THRESHOLDS = RANK_THRESHOLDS_CHALLENGE;

/**
 * Get rank based on score and difficulty
 */
export function getRank(score: number, difficulty: 'normal' | 'challenge' = 'normal'): string {
  const thresholds = difficulty === 'normal' ? RANK_THRESHOLDS_NORMAL : RANK_THRESHOLDS_CHALLENGE;
  for (const { rank, threshold } of thresholds) {
    if (score >= threshold) return rank;
  }
  return 'D';
}

/**
 * Check if player can progress to next level
 * Requires B rank or better for normal levels, A rank for boss levels
 */
export function canProgressToNextLevel(rank: string, isBossLevel: boolean = false, difficulty: 'normal' | 'challenge' = 'normal'): boolean {
  if (isBossLevel) {
    // Boss levels (Level 10) require A rank or better in BOTH modes
    const bossProgressionRanks = ['SS', 'S+', 'S', 'S-', 'A+', 'A'];
    return bossProgressionRanks.includes(rank);
  }
  
  // Regular levels require B rank or better
  const progressionRanks = ['SS', 'S+', 'S', 'S-', 'A+', 'A', 'A-', 'B+', 'B'];
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
 * Get next rank info (difficulty-aware)
 */
export function getNextRankInfo(currentRank: string, difficulty: 'normal' | 'challenge' = 'normal'): RankInfo | null {
  const thresholds = difficulty === 'normal' ? RANK_THRESHOLDS_NORMAL : RANK_THRESHOLDS_CHALLENGE;
  const currentIndex = thresholds.findIndex(r => r.rank === currentRank);
  return currentIndex > 0 ? thresholds[currentIndex - 1] : null;
}

/**
 * Get points needed to reach next rank (difficulty-aware)
 */
export function getPointsToNextRank(score: number, currentRank: string, difficulty: 'normal' | 'challenge' = 'normal'): number {
  const nextRank = getNextRankInfo(currentRank, difficulty);
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
  
  // Time tips - updated for neutral zone scoring
  if (timeElapsed > 45) {
    tips.push("Work faster! Time over 45s incurs penalties");
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
      hintPenalty: 0, // No hint penalty in custom games
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
