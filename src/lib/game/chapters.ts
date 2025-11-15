export interface ChapterConfig {
  id: number;
  name: string;
  description: string;
  basePings: number;
  targetSize: number;
  timeLimit?: number;
  specialMechanic?: string;
}

export interface LevelConfig {
  chapter: number;
  level: number;
  pings: number;
  targetSize: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const CHAPTERS: ChapterConfig[] = [
  {
    id: 1,
    name: 'First Contact',
    description: 'Learn the basics of echolocation',
    basePings: 5,
    targetSize: 120,
  },
  {
    id: 2,
    name: 'Shrinking Echoes',
    description: 'The target gets smaller',
    basePings: 4,
    targetSize: 80,
    specialMechanic: 'shrinking_target',
  },
];

export function getLevelConfig(chapter: number, level: number): LevelConfig {
  const chapterConfig = CHAPTERS.find(c => c.id === chapter) || CHAPTERS[0];
  
  // Difficulty scales with level
  const difficulty = level <= 3 ? 'easy' : level <= 7 ? 'medium' : 'hard';
  
  // Reduce pings slightly as levels progress
  const pingReduction = Math.floor(level / 3);
  const pings = Math.max(3, chapterConfig.basePings - pingReduction);
  
  // Reduce target size slightly as levels progress
  const sizeReduction = level * 4;
  const targetSize = Math.max(60, chapterConfig.targetSize - sizeReduction);
  
  return {
    chapter,
    level,
    pings,
    targetSize,
    difficulty,
  };
}

export function getChapterProgress(chapter: number, level: number): number {
  const maxLevelsPerChapter = 10;
  return Math.min(100, (level / maxLevelsPerChapter) * 100);
}
