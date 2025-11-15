/**
 * Custom game statistics tracking
 */

import { CustomGameConfig } from './customConfig';

export interface CustomGameStats {
  totalGames: number;
  totalRounds: number;
  bestScore: number;
  bestProximity: number;
  fastestTime: number;
  averageScore: number;
  averageProximity: number;
  totalPingsUsed: number;
  gamesWon: number;
  gamesLost: number;
  
  statsByMode: {
    unlimited: GameModeStats;
    limited: GameModeStats;
  };
  
  statsByArena: {
    small: GameModeStats;
    medium: GameModeStats;
    large: GameModeStats;
  };
  
  recentGames: RecentGame[];
  
  perfectGames: number;
  speedrunGames: number;
  efficientGames: number;
}

interface GameModeStats {
  gamesPlayed: number;
  bestScore: number;
  averageScore: number;
}

interface RecentGame {
  timestamp: number;
  score: number;
  proximity: number;
  pingsUsed: number;
  timeElapsed: number;
  configHash: string;
  passedCondition?: boolean;
}

const STATS_KEY = 'echo_custom_stats';
const MAX_RECENT_GAMES = 50;

export function loadCustomStats(): CustomGameStats {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load custom stats:', e);
  }
  
  return getDefaultStats();
}

function getDefaultStats(): CustomGameStats {
  return {
    totalGames: 0,
    totalRounds: 0,
    bestScore: 0,
    bestProximity: 0,
    fastestTime: Infinity,
    averageScore: 0,
    averageProximity: 0,
    totalPingsUsed: 0,
    gamesWon: 0,
    gamesLost: 0,
    statsByMode: {
      unlimited: { gamesPlayed: 0, bestScore: 0, averageScore: 0 },
      limited: { gamesPlayed: 0, bestScore: 0, averageScore: 0 },
    },
    statsByArena: {
      small: { gamesPlayed: 0, bestScore: 0, averageScore: 0 },
      medium: { gamesPlayed: 0, bestScore: 0, averageScore: 0 },
      large: { gamesPlayed: 0, bestScore: 0, averageScore: 0 },
    },
    recentGames: [],
    perfectGames: 0,
    speedrunGames: 0,
    efficientGames: 0,
  };
}

export function recordCustomGame(
  config: CustomGameConfig,
  score: number,
  proximity: number,
  pingsUsed: number,
  timeElapsed: number,
  passedCondition?: boolean
): void {
  const stats = loadCustomStats();
  
  stats.totalGames += 1;
  stats.totalRounds += config.multiRound ? config.numberOfRounds : 1;
  stats.bestScore = Math.max(stats.bestScore, score);
  stats.bestProximity = Math.max(stats.bestProximity, proximity);
  if (config.timerEnabled && timeElapsed > 0) {
    stats.fastestTime = Math.min(stats.fastestTime, timeElapsed);
  }
  stats.totalPingsUsed += pingsUsed;
  
  stats.averageScore = Math.round(
    (stats.averageScore * (stats.totalGames - 1) + score) / stats.totalGames
  );
  stats.averageProximity = Math.round(
    (stats.averageProximity * (stats.totalGames - 1) + proximity) / stats.totalGames
  );
  
  if (passedCondition !== undefined) {
    if (passedCondition) {
      stats.gamesWon += 1;
    } else {
      stats.gamesLost += 1;
    }
  }
  
  const modeKey = config.pingsMode;
  stats.statsByMode[modeKey].gamesPlayed += 1;
  stats.statsByMode[modeKey].bestScore = Math.max(
    stats.statsByMode[modeKey].bestScore,
    score
  );
  stats.statsByMode[modeKey].averageScore = Math.round(
    (stats.statsByMode[modeKey].averageScore * (stats.statsByMode[modeKey].gamesPlayed - 1) + score) /
    stats.statsByMode[modeKey].gamesPlayed
  );
  
  const arenaKey = config.arenaSize;
  stats.statsByArena[arenaKey].gamesPlayed += 1;
  stats.statsByArena[arenaKey].bestScore = Math.max(
    stats.statsByArena[arenaKey].bestScore,
    score
  );
  stats.statsByArena[arenaKey].averageScore = Math.round(
    (stats.statsByArena[arenaKey].averageScore * (stats.statsByArena[arenaKey].gamesPlayed - 1) + score) /
    stats.statsByArena[arenaKey].gamesPlayed
  );
  
  if (proximity === 100) stats.perfectGames += 1;
  if (config.timerEnabled && timeElapsed < 10) stats.speedrunGames += 1;
  if (config.pingsMode === 'limited' && pingsUsed < config.pingsCount) {
    const efficiency = (config.pingsCount - pingsUsed) / config.pingsCount;
    if (efficiency === 1) stats.efficientGames += 1;
  }
  
  const configHash = generateConfigHash(config);
  stats.recentGames.unshift({
    timestamp: Date.now(),
    score,
    proximity,
    pingsUsed,
    timeElapsed,
    configHash,
    passedCondition,
  });
  
  stats.recentGames = stats.recentGames.slice(0, MAX_RECENT_GAMES);
  
  saveCustomStats(stats);
}

function saveCustomStats(stats: CustomGameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save custom stats:', e);
  }
}

function generateConfigHash(config: CustomGameConfig): string {
  const str = JSON.stringify(config);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

export function resetCustomStats(): void {
  localStorage.removeItem(STATS_KEY);
}
