// Cache layer
let statsCache: ChapterStatsMap | null = null;
let progressCache: ChapterProgress | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

export interface ChapterStats {
  completed: boolean;
  totalPings: number;
  avgScore: number;
  bestScore: number;
  totalTime: number;
  completedAt?: string;
  levelsCompleted: number;
  unlockedBoons?: string[];
  
  // Additional tracking metrics
  totalAttempts: number;      // Every play attempt (pass or fail)
  successfulAttempts: number; // Only B rank or better
  perfectRounds: number;      // SS rank count
  bestPingCount: number;      // Fewest pings for a successful level
  fastestTime: number;        // Fastest completion for any level
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
  rank: string
) {
  const stats = loadChapterStats();
  const levelInChapter = ((level - 1) % 10) + 1;
  
  if (!stats[chapter]) {
    stats[chapter] = {
      completed: false,
      totalPings: 0,
      avgScore: 0,
      bestScore: 0,
      totalTime: 0,
      levelsCompleted: 0,
      totalAttempts: 0,
      successfulAttempts: 0,
      perfectRounds: 0,
      bestPingCount: Infinity,
      fastestTime: Infinity,
    };
  }

  const chapterStat = stats[chapter];
  
  // Track every attempt
  chapterStat.totalAttempts++;
  
  // Check if this was a successful attempt (B rank or better)
  const progressionRanks = ['SS', 'S+', 'S', 'A+', 'A', 'B+', 'B'];
  const isSuccess = progressionRanks.includes(rank);
  
  if (isSuccess) {
    chapterStat.successfulAttempts++;
    chapterStat.totalPings += pings;
    chapterStat.totalTime += time;
    chapterStat.levelsCompleted = Math.max(chapterStat.levelsCompleted, levelInChapter);
    chapterStat.bestScore = Math.max(chapterStat.bestScore, score);
    
    // Track best ping efficiency
    chapterStat.bestPingCount = Math.min(chapterStat.bestPingCount, pings);
    
    // Track fastest time
    chapterStat.fastestTime = Math.min(chapterStat.fastestTime, time);
    
    // Track perfect rounds (SS rank)
    if (rank === 'SS') {
      chapterStat.perfectRounds++;
    }
    
    // Calculate average score (only from successful attempts)
    const totalSuccessful = chapterStat.successfulAttempts;
    chapterStat.avgScore = ((chapterStat.avgScore * (totalSuccessful - 1)) + score) / totalSuccessful;
  }

  // Mark as completed if all 10 levels done
  if (levelInChapter === 10 && isSuccess) {
    chapterStat.completed = true;
    chapterStat.completedAt = new Date().toISOString();
    
    if (!chapterStat.unlockedBoons) {
      chapterStat.unlockedBoons = [];
    }
  }

  saveChapterStats(stats);
  return stats[chapter];
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
