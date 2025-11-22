import { CHAPTERS, ChapterConfig } from './chapters';

const chapterCache = new Map<number, ChapterConfig>();

/**
 * Get chapter configuration with caching
 */
export function getChapterConfig(chapterId: number): ChapterConfig {
  if (chapterCache.has(chapterId)) {
    return chapterCache.get(chapterId)!;
  }
  
  const config = CHAPTERS[chapterId];
  if (!config) {
    throw new Error(`Chapter ${chapterId} not found`);
  }
  
  chapterCache.set(chapterId, config);
  return config;
}

/**
 * Preload all chapters in background (optional optimization)
 */
export function preloadChapters() {
  Object.keys(CHAPTERS).forEach(id => {
    const chapterId = parseInt(id);
    if (!chapterCache.has(chapterId)) {
      chapterCache.set(chapterId, CHAPTERS[chapterId]);
    }
  });
}

/**
 * Clear chapter cache (useful for testing)
 */
export function clearChapterCache() {
  chapterCache.clear();
}
