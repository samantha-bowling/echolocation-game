import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Target, Clock, Radio, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadChapterStats, ChapterStatsMap } from '@/lib/game/chapterStats';
import { CHAPTERS } from '@/lib/game/chapters';
import { cn } from '@/lib/utils';
import { StatsLoadingSkeleton } from './StatsLoadingSkeleton';

export function ClassicStats() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [chapterStats, setChapterStats] = useState<ChapterStatsMap>({});

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      
      // Wrap in setTimeout to simulate async and prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const stats = loadChapterStats();
      setChapterStats(stats);
      setIsLoading(false);
    };
    
    loadStats();
  }, []);

  if (isLoading) {
    return <StatsLoadingSkeleton />;
  }
  
  // Calculate overall stats
  const totalChapters = Object.keys(CHAPTERS).length;
  const completedChapters = Object.values(chapterStats).filter(s => s?.completed).length;
  const totalLevels = Object.values(chapterStats).reduce((sum, s) => sum + (s?.levelsCompleted || 0), 0);
  const totalPings = Object.values(chapterStats).reduce((sum, s) => sum + (s?.totalPings || 0), 0);
  const totalTime = Object.values(chapterStats).reduce((sum, s) => sum + (s?.totalTime || 0), 0);
  const bestScore = Math.max(...Object.values(chapterStats).map(s => s?.bestScore || 0), 0);
  const avgScore = totalLevels > 0
    ? Object.values(chapterStats).reduce((sum, s) => sum + (s?.avgScore || 0) * (s?.levelsCompleted || 0), 0) / totalLevels
    : 0;

  return (
    <div className="min-h-screen p-6 echo-dots">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/chapters')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Chapters
          </Button>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-display font-display tracking-tight">
            Classic Mode Statistics
          </h1>
          <p className="text-muted-foreground">
            Your journey through the chapters
          </p>
        </div>

        {/* Overall Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flat-card bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <div className="text-3xl font-display font-bold text-foreground">
                  {completedChapters}/{totalChapters}
                </div>
                <div className="text-xs text-muted-foreground">Chapters</div>
              </div>
            </div>
          </div>

          <div className="flat-card bg-accent/5 border-accent/20">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-accent" />
              <div>
                <div className="text-3xl font-display font-bold text-foreground">
                  {totalLevels}
                </div>
                <div className="text-xs text-muted-foreground">Levels Complete</div>
              </div>
            </div>
          </div>

          <div className="flat-card bg-secondary/5 border-secondary/20">
            <div className="flex items-center gap-3">
              <Radio className="w-8 h-8 text-secondary-foreground" />
              <div>
                <div className="text-3xl font-display font-bold text-foreground">
                  {totalPings}
                </div>
                <div className="text-xs text-muted-foreground">Total Pings</div>
              </div>
            </div>
          </div>

          <div className="flat-card bg-muted/50 border-muted">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-muted-foreground" />
              <div>
                <div className="text-3xl font-display font-bold text-foreground">
                  {Math.floor(totalTime)}s
                </div>
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="flat-card">
          <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Best Score</div>
              <div className="text-4xl font-display font-bold text-primary">
                {Math.round(bestScore)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Average Score</div>
              <div className="text-4xl font-display font-bold text-accent">
                {Math.round(avgScore)}
              </div>
            </div>
          </div>
        </div>

        {/* Per-Chapter Stats */}
        <div className="flat-card">
          <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent" />
            Chapter Progress
          </h2>
          <div className="space-y-4">
            {Object.entries(CHAPTERS).map(([id, chapter]) => {
              const chapterId = parseInt(id);
              const stats = chapterStats[chapterId];
              const progress = stats?.levelsCompleted || 0;
              const completed = stats?.completed || false;

              return (
                <div 
                  key={chapterId}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all",
                    completed 
                      ? "bg-primary/5 border-primary/20" 
                      : progress > 0 
                        ? "bg-accent/5 border-accent/20"
                        : "bg-muted/20 border-muted"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-display font-semibold text-foreground">
                        Chapter {chapterId}: {chapter.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{chapter.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-display font-bold text-foreground">
                        {progress}/10
                      </div>
                      <div className="text-xs text-muted-foreground">Levels</div>
                    </div>
                  </div>

                  {stats && progress > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-border/50">
                      <div>
                        <div className="text-xs text-muted-foreground">Best Score</div>
                        <div className="text-lg font-semibold text-foreground">
                          {Math.round(stats.bestScore)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Avg Score</div>
                        <div className="text-lg font-semibold text-foreground">
                          {Math.round(stats.avgScore)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Total Pings</div>
                        <div className="text-lg font-semibold text-foreground">
                          {stats.totalPings}
                        </div>
                      </div>
                    </div>
                  )}

                  {completed && stats.completedAt && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Completed {new Date(stats.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
