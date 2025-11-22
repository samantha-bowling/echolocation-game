import { Trophy, Star, Radio, Clock, ArrowRight, Home, Award, Target, Zap, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChapterConfig, CHAPTERS } from '@/lib/game/chapters';
import { ChapterStats, getDifficultyPreference } from '@/lib/game/chapterStats';

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
  const difficulty = getDifficultyPreference();
  const difficultyStats = stats[difficulty];

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
        <ScrollArea className="flex-1 p-8">
          {/* Celebration Header */}
          <div className="text-center space-y-4 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy
                className="w-16 h-16 animate-bounce"
                style={{ color: chapter.theme.primary }}
              />
              <Star className="w-12 h-12 text-accent animate-pulse" />
            </div>

            {/* Difficulty Badge */}
            <div className="flex justify-center mb-4">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2"
                style={{
                  borderColor: difficulty === 'normal' ? 'rgb(59, 130, 246)' : 'rgb(234, 179, 8)',
                  background: difficulty === 'normal' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(234, 179, 8, 0.1)'
                }}
              >
                {difficulty === 'normal' ? (
                  <>
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-blue-400">Normal Mode Completed</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold text-yellow-400">Challenge Mode Completed</span>
                  </>
                )}
              </div>
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

          {/* Stats Grid - Show difficulty-specific stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div
              className="p-6 rounded-xl text-center"
              style={{ background: `${chapter.theme.primary}15` }}
            >
              <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: chapter.theme.accent }} />
              <div className="text-3xl font-bold text-foreground">
                {Math.round(difficultyStats.bestScore)}
              </div>
              <div className="text-sm text-muted-foreground">Best Score</div>
            </div>

            <div
              className="p-6 rounded-xl text-center"
              style={{ background: `${chapter.theme.primary}15` }}
            >
              <Star className="w-8 h-8 mx-auto mb-2" style={{ color: chapter.theme.accent }} />
              <div className="text-3xl font-bold text-foreground">
                {Math.round(difficultyStats.avgScore)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </div>

            <div
              className="p-6 rounded-xl text-center"
              style={{ background: `${chapter.theme.primary}15` }}
            >
              <Radio className="w-8 h-8 mx-auto mb-2" style={{ color: chapter.theme.accent }} />
              <div className="text-3xl font-bold text-foreground">
                {difficultyStats.levelsCompleted > 0
                  ? Math.round(difficultyStats.totalPings / difficultyStats.levelsCompleted)
                  : 0}
              </div>
              <div className="text-sm text-muted-foreground">Avg Pings</div>
            </div>

            <div
              className="p-6 rounded-xl text-center"
              style={{ background: `${chapter.theme.primary}15` }}
            >
              <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: chapter.theme.accent }} />
              <div className="text-3xl font-bold text-foreground">
                {formatTime(difficultyStats.totalTime)}
              </div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
          </div>

          {/* Additional Stats - 3x3 Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Performance */}
            <div
              className="p-4 rounded-lg text-center"
              style={{ background: `${chapter.theme.primary}10` }}
            >
              <div className="text-xs text-muted-foreground uppercase mb-2">Performance</div>
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Win Rate</div>
                  <div className="text-xl font-bold text-foreground">
                    {difficultyStats.totalAttempts > 0
                      ? Math.round((difficultyStats.successfulAttempts / difficultyStats.totalAttempts) * 100)
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </div>

            {/* Efficiency */}
            <div
              className="p-4 rounded-lg text-center"
              style={{ background: `${chapter.theme.primary}10` }}
            >
              <div className="text-xs text-muted-foreground uppercase mb-2">Efficiency</div>
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Best Efficiency</div>
                  <div className="text-xl font-bold text-foreground">
                    {difficultyStats.bestPingCount !== Infinity ? difficultyStats.bestPingCount : '-'} pings
                  </div>
                </div>
              </div>
            </div>

            {/* Time */}
            <div
              className="p-4 rounded-lg text-center"
              style={{ background: `${chapter.theme.primary}10` }}
            >
              <div className="text-xs text-muted-foreground uppercase mb-2">Time</div>
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Fastest Clear</div>
                  <div className="text-xl font-bold text-foreground">
                    {difficultyStats.fastestTime !== Infinity
                      ? `${Math.round(difficultyStats.fastestTime)}s`
                      : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Perfect Rounds & Attempts Callout */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div
              className="p-4 rounded-lg text-center"
              style={{ background: `${chapter.theme.accent}15` }}
            >
              <Award className="w-6 h-6 mx-auto mb-2" style={{ color: chapter.theme.accent }} />
              <div className="text-2xl font-bold text-foreground">
                {difficultyStats.perfectRounds}
              </div>
              <div className="text-sm text-muted-foreground">Perfect Rounds (SS)</div>
            </div>

            <div
              className="p-4 rounded-lg text-center"
              style={{ background: `${chapter.theme.accent}15` }}
            >
              <Target className="w-6 h-6 mx-auto mb-2" style={{ color: chapter.theme.accent }} />
              <div className="text-2xl font-bold text-foreground">
                {difficultyStats.totalAttempts}
              </div>
              <div className="text-sm text-muted-foreground">Total Attempts</div>
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="p-6 border-t border-border/50 space-y-3">
          {!isLastChapter && nextChapter && (
            <Button
              size="lg"
              className="w-full"
              onClick={onContinue}
              style={{
                background: chapter.theme.primary,
                color: 'white',
              }}
            >
              Continue to Chapter {nextChapter.id}: {nextChapter.name}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}

          <Button size="lg" variant="outline" className="w-full" onClick={onMainMenu}>
            <Home className="w-5 h-5 mr-2" />
            Return to Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
