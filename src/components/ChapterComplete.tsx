import { Trophy, Star, Radio, Clock, ArrowRight, Home, Award, Target, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChapterConfig, CHAPTERS } from '@/lib/game/chapters';
import { ChapterStats } from '@/lib/game/chapterStats';

interface ChapterCompleteProps {
  chapter: ChapterConfig;
  stats: ChapterStats;
  onContinue: () => void;
  onMainMenu: () => void;
}

export function ChapterComplete({
  chapter,
  stats,
  onContinue,
  onMainMenu,
}: ChapterCompleteProps) {
  const nextChapter = CHAPTERS.find((c) => c.id === chapter.id + 1);
  const isLastChapter = chapter.id === CHAPTERS.length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{
        background: `linear-gradient(135deg, ${chapter.theme.primary}25, ${chapter.theme.secondary}35)`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-card/95 backdrop-blur-sm rounded-2xl border-2 shadow-2xl overflow-hidden flex flex-col"
        style={{
          borderColor: chapter.theme.primary,
        }}
      >
        {/* Celebration Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy
              className="w-16 h-16 animate-bounce"
              style={{ color: chapter.theme.primary }}
            />
            <Star className="w-12 h-12 text-accent animate-pulse" />
          </div>

          <div
            className="inline-block px-6 py-2 rounded-full text-sm font-semibold"
            style={{
              background: `${chapter.theme.primary}30`,
              color: chapter.theme.primary,
            }}
          >
            Chapter {chapter.id} Complete
          </div>

          <h2
            className="text-5xl font-display font-bold tracking-tight"
            style={{ color: chapter.theme.primary }}
          >
            {chapter.name}
          </h2>

          <p className="text-xl text-muted-foreground">Congratulations! Chapter mastered!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div
            className="p-6 rounded-xl text-center"
            style={{ background: `${chapter.theme.primary}15` }}
          >
            <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: chapter.theme.accent }} />
            <div className="text-3xl font-bold text-foreground">
              {Math.round(stats.bestScore)}
            </div>
            <div className="text-sm text-muted-foreground">Best Score</div>
          </div>

          <div
            className="p-6 rounded-xl text-center"
            style={{ background: `${chapter.theme.primary}15` }}
          >
            <Star className="w-8 h-8 mx-auto mb-2" style={{ color: chapter.theme.accent }} />
            <div className="text-3xl font-bold text-foreground">
              {Math.round(stats.avgScore)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Score</div>
          </div>

          <div
            className="p-6 rounded-xl text-center"
            style={{ background: `${chapter.theme.primary}15` }}
          >
            <Radio className="w-8 h-8 mx-auto mb-2" style={{ color: chapter.theme.accent }} />
            <div className="text-3xl font-bold text-foreground">{stats.totalPings}</div>
            <div className="text-sm text-muted-foreground">Total Pings</div>
          </div>

          <div
            className="p-6 rounded-xl text-center"
            style={{ background: `${chapter.theme.primary}15` }}
          >
            <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: chapter.theme.accent }} />
            <div className="text-3xl font-bold text-foreground">
              {formatTime(stats.totalTime)}
            </div>
            <div className="text-sm text-muted-foreground">Total Time</div>
          </div>
        </div>

        {/* Next Chapter Unlock */}
        {!isLastChapter && nextChapter && (
          <div
            className="p-6 rounded-xl mb-6 border-2 animate-pulse"
            style={{
              background: `${nextChapter.theme.primary}10`,
              borderColor: `${nextChapter.theme.primary}50`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: `${nextChapter.theme.primary}30`,
                      color: nextChapter.theme.primary,
                    }}
                  >
                    Next Chapter Unlocked!
                  </span>
                </div>
                <h3
                  className="text-2xl font-display font-bold"
                  style={{ color: nextChapter.theme.primary }}
                >
                  {nextChapter.name}
                </h3>
                <p className="text-sm text-muted-foreground">{nextChapter.description}</p>
              </div>
              <ArrowRight
                className="w-12 h-12 flex-shrink-0"
                style={{ color: nextChapter.theme.primary }}
              />
            </div>
          </div>
        )}

        {/* Final Game Complete Message */}
        {isLastChapter && (
          <div className="p-6 rounded-xl mb-6 bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary">
            <div className="text-center space-y-2">
              <Trophy className="w-16 h-16 mx-auto text-primary animate-bounce" />
              <h3 className="text-3xl font-display font-bold text-foreground">
                🎉 Game Complete! 🎉
              </h3>
              <p className="text-lg text-muted-foreground">
                You've mastered all 50 levels of Echolocation!
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-14 gap-2"
            onClick={onMainMenu}
          >
            <Home className="w-5 h-5" />
            Main Menu
          </Button>
          {!isLastChapter && (
            <Button
              size="lg"
              className="flex-1 h-14 gap-2 font-semibold"
              style={{
                background: nextChapter?.theme.primary || chapter.theme.primary,
                color: 'white',
              }}
              onClick={onContinue}
            >
              Continue to Chapter {chapter.id + 1}
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
