// Cache layer
let statsCache: ChapterStatsMap | null = null;
let progressCache: ChapterProgress | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

export interface DifficultyStats {
  bestScore: number;
  bestRank: string;
  levelsCompleted: number;
  totalPings: number;
  avgScore: number;
  totalTime: number;
  totalAttempts: number;
  successfulAttempts: number;
  perfectRounds: number;
  bestPingCount: number;
  fastestTime: number;
}

export interface ChapterStats {
  completed: boolean;
  completedAt?: string;
  unlockedBoons?: string[];
  
  // Separate stats for each difficulty
  normal: DifficultyStats;
  challenge: DifficultyStats;
}

export interface ChapterStatsMap {
  [chapterId: number]: ChapterStats;
}

export interface ChapterProgress {
  [chapterId: number]: {
    currentLevel: number;    // Last played level within chapter (1-10)
    lastPlayedAt: string;    // ISO timestamp
  };
}

export function loadChapterStats(): ChapterStatsMap {
  const now = Date.now();
  
  // Return cached data if valid
  if (statsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return statsCache;
  }
  
  const stored = localStorage.getItem('echo_chapter_stats');
  if (stored) {
    try {
      statsCache = JSON.parse(stored);
      cacheTimestamp = now;
      return statsCache;
    } catch {
      return {};
    }
  }
  return {};
}

export function saveChapterStats(stats: ChapterStatsMap) {
  localStorage.setItem('echo_chapter_stats', JSON.stringify(stats));
  statsCache = null; // Force fresh load next time
  cacheTimestamp = 0;
}

export function loadChapterProgress(): ChapterProgress {
  const now = Date.now();
  
  // Return cached data if valid
  if (progressCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return progressCache;
  }
  
  const stored = localStorage.getItem('echo_chapter_progress');
  if (stored) {
    try {
      progressCache = JSON.parse(stored);
      cacheTimestamp = now;
      return progressCache;
    } catch {
      return {};
    }
  }
  return {};
}

export function saveChapterProgress(chapterId: number, level: number) {
  const progress = loadChapterProgress();
  const levelInChapter = ((level - 1) % 10) + 1;  // Normalize to 1-10
  progress[chapterId] = {
    currentLevel: levelInChapter,
    lastPlayedAt: new Date().toISOString(),
  };
  localStorage.setItem('echo_chapter_progress', JSON.stringify(progress));
}

export function updateChapterStats(
  chapter: number,
  level: number,
  pings: number,
  score: number,
  time: number,
  rank: string,
  difficulty: 'normal' | 'challenge' = 'normal'
) {
  const stats = loadChapterStats();
  const levelInChapter = ((level - 1) % 10) + 1;
  
  if (!stats[chapter]) {
    stats[chapter] = {
      completed: false,
      normal: {
        bestScore: 0,
        bestRank: 'D',
        levelsCompleted: 0,
        totalPings: 0,
        avgScore: 0,
        totalTime: 0,
        totalAttempts: 0,
        successfulAttempts: 0,
        perfectRounds: 0,
        bestPingCount: Infinity,
        fastestTime: Infinity,
      },
      challenge: {
        bestScore: 0,
        bestRank: 'D',
        levelsCompleted: 0,
        totalPings: 0,
        avgScore: 0,
        totalTime: 0,
        totalAttempts: 0,
        successfulAttempts: 0,
        perfectRounds: 0,
        bestPingCount: Infinity,
        fastestTime: Infinity,
      },
    };
  }

  const chapterStat = stats[chapter];
  const difficultyStats = chapterStat[difficulty];
  
  // Track every attempt
  difficultyStats.totalAttempts++;
  
  // Check if this was a successful attempt (B rank or better)
  const progressionRanks = ['SS', 'S+', 'S', 'S-', 'A+', 'A', 'A-', 'B+', 'B'];
  const isSuccess = progressionRanks.includes(rank);
  
  if (isSuccess) {
    difficultyStats.successfulAttempts++;
    difficultyStats.totalPings += pings;
    difficultyStats.totalTime += time;
    difficultyStats.levelsCompleted = Math.max(difficultyStats.levelsCompleted, levelInChapter);
    difficultyStats.bestScore = Math.max(difficultyStats.bestScore, score);
    
    // Update best rank
    const currentRankIndex = progressionRanks.indexOf(difficultyStats.bestRank);
    const newRankIndex = progressionRanks.indexOf(rank);
    if (newRankIndex < currentRankIndex || difficultyStats.bestRank === 'D') {
      difficultyStats.bestRank = rank;
    }
    
    // Track best ping efficiency
    difficultyStats.bestPingCount = Math.min(difficultyStats.bestPingCount, pings);
    
    // Track fastest time
    difficultyStats.fastestTime = Math.min(difficultyStats.fastestTime, time);
    
    // Track perfect rounds (SS rank)
    if (rank === 'SS') {
      difficultyStats.perfectRounds++;
    }
    
    // Calculate average score (only from successful attempts)
    const totalSuccessful = difficultyStats.successfulAttempts;
    difficultyStats.avgScore = ((difficultyStats.avgScore * (totalSuccessful - 1)) + score) / totalSuccessful;
  }

  // Mark as completed if all 10 levels done on EITHER difficulty
  if (levelInChapter === 10 && isSuccess) {
    chapterStat.completed = true;
    chapterStat.completedAt = new Date().toISOString();
    
    if (!chapterStat.unlockedBoons) {
      chapterStat.unlockedBoons = [];
    }
  }

  saveChapterStats(stats);
  return chapterStat;
}


export function getSeenChapterIntros(): number[] {
  const stored = localStorage.getItem('echo_seen_chapter_intros');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function markChapterIntroSeen(chapter: number) {
  const seen = getSeenChapterIntros();
  if (!seen.includes(chapter)) {
    seen.push(chapter);
    localStorage.setItem('echo_seen_chapter_intros', JSON.stringify(seen));
  }
}

// Manual cache invalidation
export function invalidateStatsCache() {
  statsCache = null;
  progressCache = null;
  cacheTimestamp = 0;
}

// Difficulty preference storage
export function getDifficultyPreference(): 'normal' | 'challenge' {
  const stored = localStorage.getItem('echo_difficulty_preference');
  return stored === 'challenge' ? 'challenge' : 'normal';
}

export function setDifficultyPreference(difficulty: 'normal' | 'challenge') {
  localStorage.setItem('echo_difficulty_preference', difficulty);
}

