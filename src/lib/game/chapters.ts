export interface ChapterTheme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface ChapterConfig {
  id: number;
  name: string;
  description: string;
  basePings: number;
  targetSize: number;
  timeLimit?: number;
  specialMechanic?: string;
  theme: ChapterTheme;
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
    theme: {
      primary: 'hsl(217, 91%, 60%)', // Blue
      secondary: 'hsl(217, 91%, 70%)',
      accent: 'hsl(217, 91%, 50%)',
    },
  },
  {
    id: 2,
    name: 'Shrinking Echoes',
    description: 'The target shrinks after each ping',
    basePings: 4,
    targetSize: 80,
    specialMechanic: 'shrinking_target',
    theme: {
      primary: 'hsl(280, 91%, 60%)', // Purple/Magenta
      secondary: 'hsl(280, 91%, 70%)',
      accent: 'hsl(280, 91%, 50%)',
    },
  },
];

/**
 * Get chapter number from level (10 levels per chapter)
 */
export function getChapterFromLevel(level: number): number {
  return Math.min(Math.floor((level - 1) / 10) + 1, CHAPTERS.length);
}

/**
 * Get chapter config by chapter ID
 */
export function getChapterConfig(chapter: number): ChapterConfig {
  return CHAPTERS.find(c => c.id === chapter) || CHAPTERS[0];
}

export function getLevelConfig(chapter: number, level: number): LevelConfig {
  const chapterConfig = getChapterConfig(chapter);
  
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
