export interface ChapterStats {
  completed: boolean;
  totalPings: number;
  avgScore: number;
  bestScore: number;
  totalTime: number;
  completedAt?: string;
  levelsCompleted: number;
  completionBonus?: number;
}

export interface ChapterStatsMap {
  [chapterId: number]: ChapterStats;
}

export function loadChapterStats(): ChapterStatsMap {
  const stored = localStorage.getItem('echo_chapter_stats');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
}

export function saveChapterStats(stats: ChapterStatsMap) {
  localStorage.setItem('echo_chapter_stats', JSON.stringify(stats));
}

export function updateChapterStats(
  chapter: number,
  level: number,
  pings: number,
  score: number,
  time: number
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
    };
  }

  const chapterStat = stats[chapter];
  chapterStat.totalPings += pings;
  chapterStat.totalTime += time;
  chapterStat.levelsCompleted = Math.max(chapterStat.levelsCompleted, levelInChapter);
  chapterStat.bestScore = Math.max(chapterStat.bestScore, score);
  
  // Calculate average score
  const totalLevels = chapterStat.levelsCompleted;
  chapterStat.avgScore = ((chapterStat.avgScore * (totalLevels - 1)) + score) / totalLevels;

  // Mark as completed if all 10 levels done
  if (levelInChapter === 10) {
    chapterStat.completed = true;
    chapterStat.completedAt = new Date().toISOString();
    chapterStat.completionBonus = calculateCompletionBonus(chapterStat.avgScore);
  }

  saveChapterStats(stats);
  return stats[chapter];
}

/**
 * Calculate completion bonus based on average chapter score
 * Rewards consistent performance with tiered bonuses
 */
export function calculateCompletionBonus(avgScore: number): number {
  if (avgScore >= 2600) return 1000; // Master tier
  if (avgScore >= 2000) return 750;  // Expert tier
  if (avgScore >= 1400) return 500;  // Skilled tier
  if (avgScore >= 800) return 300;   // Competent tier
  return 150; // Completion tier (any score)
}

/**
 * Get the tier name for a given average score
 */
export function getCompletionBonusTier(avgScore: number): string {
  if (avgScore >= 2600) return 'Master';
  if (avgScore >= 2000) return 'Expert';
  if (avgScore >= 1400) return 'Skilled';
  if (avgScore >= 800) return 'Competent';
  return 'Complete';
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
