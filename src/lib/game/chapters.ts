export type SpecialMechanic = 
  | 'shrinking_target' 
  | 'moving_target' 
  | 'phantom_targets' 
  | 'combined_challenge';

export interface ChapterTheme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface MechanicDetails {
  shrinkAmount?: number;
  minTargetSize?: number;
  moveInterval?: number;
  moveDistance?: number;
  phantomCount?: number;
  combinedEffects?: SpecialMechanic[];
}

export interface ChapterConfig {
  id: number;
  name: string;
  description: string;
  basePings: number;
  targetSize: number;
  timeLimit?: number;
  specialMechanic?: SpecialMechanic;
  mechanicDetails?: MechanicDetails;
  theme: ChapterTheme;
  replaysAvailable?: number;
  boonUnlock?: string;
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
    replaysAvailable: -1, // Unlimited replays for learning
  },
  {
    id: 2,
    name: 'Shrinking Echoes',
    description: 'The target shrinks after each ping',
    basePings: 4,
    targetSize: 80,
    specialMechanic: 'shrinking_target',
    mechanicDetails: {
      shrinkAmount: 3,
      minTargetSize: 40,
    },
    theme: {
      primary: 'hsl(280, 91%, 60%)', // Purple/Magenta
      secondary: 'hsl(280, 91%, 70%)',
      accent: 'hsl(280, 91%, 50%)',
    },
    replaysAvailable: 0,
  },
  {
    id: 3,
    name: 'Moving Shadows',
    description: 'The target drifts after each ping',
    basePings: 4,
    targetSize: 90,
    specialMechanic: 'moving_target',
    mechanicDetails: {
      moveInterval: 1,
      moveDistance: 30,
    },
    theme: {
      primary: 'hsl(30, 91%, 60%)', // Orange/Amber
      secondary: 'hsl(30, 91%, 70%)',
      accent: 'hsl(30, 91%, 50%)',
    },
    replaysAvailable: 0,
  },
  {
    id: 4,
    name: 'Echo Interference',
    description: 'Phantom targets appear to confuse you',
    basePings: 5,
    targetSize: 100,
    specialMechanic: 'phantom_targets',
    mechanicDetails: {
      phantomCount: 2,
    },
    theme: {
      primary: 'hsl(350, 91%, 60%)', // Red/Pink
      secondary: 'hsl(350, 91%, 70%)',
      accent: 'hsl(350, 91%, 50%)',
    },
    replaysAvailable: 0,
  },
  {
    id: 5,
    name: 'Perfect Silence',
    description: 'All mechanics combined - the ultimate challenge',
    basePings: 3,
    targetSize: 70,
    specialMechanic: 'combined_challenge',
    mechanicDetails: {
      shrinkAmount: 2,
      minTargetSize: 35,
      moveInterval: 1,
      moveDistance: 25,
      phantomCount: 2,
      combinedEffects: ['shrinking_target', 'moving_target', 'phantom_targets'],
    },
    theme: {
      primary: 'hsl(45, 91%, 70%)', // Gold/White
      secondary: 'hsl(45, 91%, 80%)',
      accent: 'hsl(45, 91%, 60%)',
    },
    replaysAvailable: 0,
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
  
  // Check if this is a boss level (every 10th level)
  const isBossLevel = level % 10 === 0;
  
  // Difficulty scales with level within chapter
  const levelInChapter = ((level - 1) % 10) + 1;
  const difficulty = levelInChapter <= 3 ? 'easy' : levelInChapter <= 7 ? 'medium' : 'hard';
  
  // Reduce pings slightly as levels progress
  const pingReduction = Math.floor(levelInChapter / 3);
  let pings = Math.max(3, chapterConfig.basePings - pingReduction);
  
  // Boss levels have fewer pings
  if (isBossLevel) {
    pings = Math.max(2, pings - 1);
  }
  
  // Reduce target size slightly as levels progress
  const sizeReduction = levelInChapter * 4;
  let targetSize = Math.max(60, chapterConfig.targetSize - sizeReduction);
  
  // Boss levels have smaller targets
  if (isBossLevel) {
    targetSize = Math.max(50, targetSize - 10);
  }
  
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
