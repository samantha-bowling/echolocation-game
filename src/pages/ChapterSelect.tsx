import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChapterCard } from '@/components/ChapterCard';
import { CHAPTERS } from '@/lib/game/chapters';
import { loadChapterStats, loadChapterProgress } from '@/lib/game/chapterStats';
import { isCheatActive } from '@/lib/game/cheats';
import { useEffect, useState } from 'react';

export default function ChapterSelect() {
  const navigate = useNavigate();
  const [chapterStats, setChapterStats] = useState(loadChapterStats());
  const [currentProgress, setCurrentProgress] = useState({ level: 1, chapter: 1 });

  useEffect(() => {
    const savedProgress = localStorage.getItem('echo_classic_progress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCurrentProgress({ level: progress.level, chapter: progress.chapter });
      } catch {
        // Ignore
      }
    }
  }, []);

  const handleContinueChapter = (chapterId: number, currentLevel: number) => {
    const startLevel = (chapterId - 1) * 10 + currentLevel;
    
    localStorage.setItem('echo_classic_progress', JSON.stringify({
      level: startLevel,
      chapter: chapterId,
    }));
    
    navigate('/classic');
  };

  const handleRestartChapter = (chapterId: number) => {
    const startLevel = (chapterId - 1) * 10 + 1;
    
    localStorage.setItem('echo_classic_progress', JSON.stringify({
      level: startLevel,
      chapter: chapterId,
    }));
    
    navigate('/classic');
  };

  const handleStartChapter = (chapterId: number) => {
    handleRestartChapter(chapterId);
  };

  const isChapterUnlocked = (chapterId: number): boolean => {
    // Check if UNLOCK_ALL cheat is active
    if (isCheatActive('UNLOCK_ALL')) return true;
    
    if (chapterId === 1) return true;
    
    const prevChapterStats = chapterStats[chapterId - 1];
    const hasProgressInChapter = chapterStats[chapterId]?.levelsCompleted > 0;
    const isCurrentChapter = currentProgress.chapter === chapterId;
    
    // Chapter is unlocked if:
    // - Previous chapter completed
    // - Has progress in this chapter (fixes cheat edge case)
    // - Currently playing this chapter
    // - Beyond this chapter
    return (
      prevChapterStats?.completed ||
      hasProgressInChapter ||
      isCurrentChapter ||
      currentProgress.chapter > chapterId
    );
  };

  const totalLevelsCompleted = Object.values(chapterStats).reduce(
    (sum, stat) => sum + (stat?.levelsCompleted || 0),
    0
  );
  const totalChaptersCompleted = Object.values(chapterStats).filter(
    (stat) => stat?.completed
  ).length;

  return (
    <div className="min-h-screen p-6 echo-dots">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Button>
          <Button variant="outline" onClick={() => navigate('/classic-stats')} className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Stats
          </Button>
        </div>

        {/* Title & Stats */}
        <div className="text-center space-y-4">
          <h1 className="text-display font-display tracking-tight">
            Chapter Select
          </h1>
          <p className="text-muted-foreground">
            Choose your challenge and master the art of echolocation
          </p>

          {/* Overall Progress */}
          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-display font-bold text-foreground">
                  {totalChaptersCompleted}/5
                </div>
                <div className="text-xs text-muted-foreground">Chapters Complete</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              <div>
                <div className="text-2xl font-display font-bold text-foreground">
                  {totalLevelsCompleted}/50
                </div>
                <div className="text-xs text-muted-foreground">Levels Complete</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CHAPTERS.map((chapter) => {
          const chapterProgress = loadChapterProgress();
          const progressInChapter = chapterProgress[chapter.id];
          const hasProgress = progressInChapter && progressInChapter.currentLevel > 1;
          
          return (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              stats={chapterStats[chapter.id] || null}
              isUnlocked={isChapterUnlocked(chapter.id)}
              currentLevelInChapter={progressInChapter?.currentLevel}
              onContinue={hasProgress ? () => handleContinueChapter(chapter.id, progressInChapter.currentLevel) : undefined}
              onRestart={hasProgress || chapterStats[chapter.id]?.completed ? () => handleRestartChapter(chapter.id) : undefined}
              onClick={!hasProgress ? () => handleStartChapter(chapter.id) : undefined}
            />
          );
        })}
      </div>
      </div>
    </div>
  );
}
