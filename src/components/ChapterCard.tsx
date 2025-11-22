import { Lock, CheckCircle2, Play, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChapterConfig } from '@/lib/game/chapters';
import { ChapterStats } from '@/lib/game/chapterStats';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/InfoTooltip';

const getMechanicSummary = (mechanic?: string): string | null => {
  switch (mechanic) {
    case 'shrinking_target':
      return '🎯 Target shrinks after each ping';
    case 'moving_target':
      return '🌊 Target drifts to new locations';
    case 'phantom_targets':
      return '👻 Decoy targets confuse you';
    case 'combined_challenge':
      return '⚡ All mechanics combined';
    default:
      return null;
  }
};

interface ChapterCardProps {
  chapter: ChapterConfig;
  stats: ChapterStats | null;
  isUnlocked: boolean;
  currentLevelInChapter?: number;
  onContinue?: () => void;
  onRestart?: () => void;
  onClick?: () => void;
}

export function ChapterCard({ chapter, stats, isUnlocked, currentLevelInChapter, onContinue, onRestart, onClick }: ChapterCardProps) {
  const progress = stats ? (stats.levelsCompleted / 10) * 100 : 0;
  const isCompleted = stats?.completed || false;
  const levelsCompleted = stats?.levelsCompleted || 0;
  const hasProgress = levelsCompleted > 0 && !isCompleted;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 group",
        isUnlocked && !hasProgress
          ? "hover:scale-105 hover:shadow-lg hover-lift cursor-pointer"
          : isUnlocked
          ? "hover:shadow-lg"
          : "opacity-60 cursor-not-allowed"
      )}
      style={{
        borderColor: isUnlocked ? chapter.theme.primary : 'hsl(var(--border))',
        background: isUnlocked
          ? `linear-gradient(135deg, ${chapter.theme.primary}15, ${chapter.theme.secondary}10)`
          : 'hsl(var(--card))',
      }}
      onClick={isUnlocked && !hasProgress ? onClick : undefined}
    >
      {/* Background Decoration */}
      <div
        className="absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
        style={{
          background: `radial-gradient(circle at 30% 50%, ${chapter.theme.primary}, transparent 70%)`,
        }}
      />

      <CardContent className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className="text-2xl font-display font-bold"
                style={{ color: isUnlocked ? chapter.theme.primary : 'hsl(var(--muted-foreground))' }}
              >
                Chapter {chapter.id}
              </h3>
              
              {/* Chapter Specs Info Tooltip */}
              <InfoTooltip
                content={
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-muted-foreground">Starting Pings:</span>
                        <span className="font-semibold">{chapter.basePings}</span>
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-muted-foreground">Levels:</span>
                        <span className="font-semibold">10</span>
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-muted-foreground">Target Size:</span>
                        <span className="font-semibold">{chapter.targetSize}px</span>
                      </div>
                    </div>
                    
                    {/* Visual Target Size Preview */}
                    <div className="flex flex-col items-center gap-2 pt-2 border-t border-border/50">
                      <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
                        Target Preview
                      </span>
                      <div
                        className="rounded-full border-2"
                        style={{
                          width: `${chapter.targetSize}px`,
                          height: `${chapter.targetSize}px`,
                          borderColor: chapter.theme.primary,
                          background: `${chapter.theme.primary}20`,
                        }}
                      />
                    </div>
                    
                    {/* Replays Info (Chapter 1 only) */}
                    {chapter.id === 1 && (
                      <div className="flex justify-between items-center pt-2 border-t border-border/50">
                        <span className="text-muted-foreground">Replays:</span>
                        <span className="font-semibold">Unlimited</span>
                      </div>
                    )}
                  </div>
                }
              />
              
              {!isUnlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
              {isCompleted && (
                <CheckCircle2 className="w-5 h-5" style={{ color: chapter.theme.accent }} />
              )}
            </div>
            <h4 className="text-lg font-semibold text-foreground">{chapter.name}</h4>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{chapter.description}</p>

        {/* Mechanic Summary */}
        {chapter.specialMechanic && (
          <div
            className="text-xs font-semibold px-3 py-2 rounded-md border"
            style={{
              borderColor: `${chapter.theme.secondary}50`,
              background: `${chapter.theme.primary}10`,
              color: chapter.theme.primary,
            }}
          >
            {getMechanicSummary(chapter.specialMechanic)}
          </div>
        )}

        {/* Progress */}
        {stats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground">
                {stats.levelsCompleted}/10 levels
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2"
              style={{
                // @ts-ignore
                '--progress-background': chapter.theme.primary,
              }}
            />
          </div>
        )}

        {/* Stats Summary */}
        {stats && stats.levelsCompleted > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Best Score</div>
              <div className="text-sm font-semibold text-foreground">
                {Math.round(stats.bestScore)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Avg Pings</div>
              <div className="text-sm font-semibold text-foreground">
                {stats.levelsCompleted > 0
                  ? Math.round(stats.totalPings / stats.levelsCompleted)
                  : 0}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Total Time</div>
              <div className="text-sm font-semibold text-foreground">
                {Math.floor(stats.totalTime / 60)}m
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isUnlocked && hasProgress && !isCompleted && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onContinue?.();
              }}
              className="w-full"
              style={{
                background: chapter.theme.primary,
                color: 'white',
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              Continue from Level {levelsCompleted + 1}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRestart?.();
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              Restart Chapter
            </Button>
          </div>
        )}

        {/* Restart for Completed Chapters */}
        {isUnlocked && isCompleted && (
          <div className="pt-2 border-t border-border/50">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRestart?.();
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              Restart Chapter
            </Button>
          </div>
        )}

        {/* Locked Message */}
        {!isUnlocked && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Complete previous chapter to unlock
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
