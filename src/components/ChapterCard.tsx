import { memo } from 'react';
import { Lock, CheckCircle2, Play, RotateCcw, Shield, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChapterConfig } from '@/lib/game/chapters';
import { ChapterStats } from '@/lib/game/chapterStats';
import { getRankColor } from '@/lib/game/scoring';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/InfoTooltip';

interface ChapterCardProps {
  chapter: ChapterConfig;
  stats: ChapterStats | null;
  isUnlocked: boolean;
  allChaptersUnlocked?: boolean;
  currentLevelInChapter?: number;
  difficulty?: 'normal' | 'challenge';
  onContinue?: () => void;
  onRestart?: () => void;
  onStart?: () => void;
  onClick?: () => void;
}

export const ChapterCard = memo(function ChapterCard({ 
  chapter, 
  stats, 
  isUnlocked, 
  allChaptersUnlocked = false,
  currentLevelInChapter, 
  difficulty = 'normal',
  onContinue, 
  onRestart, 
  onStart,
  onClick 
}: ChapterCardProps) {
  // Use difficulty-specific stats
  const difficultyStats = stats?.[difficulty];
  const progress = difficultyStats ? (difficultyStats.levelsCompleted / 10) * 100 : 0;
  const isCompleted = stats?.completed || false;
  const levelsCompleted = difficultyStats?.levelsCompleted || 0;
  const hasProgress = levelsCompleted > 0 && !isCompleted;
  
  // Show buttons if: has progress OR (all unlocked AND chapter is unlocked)
  const shouldShowButtons = isUnlocked && (hasProgress || allChaptersUnlocked);

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

        {/* Progress */}
        {stats && difficultyStats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground">
                {difficultyStats.levelsCompleted}/10 levels
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

        {/* Dual Difficulty Stats Summary */}
        {stats && (stats.normal.levelsCompleted > 0 || stats.challenge.levelsCompleted > 0) && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            {/* Normal Mode Stats */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-blue-400" />
                <span className="text-xs font-medium text-muted-foreground">Normal</span>
              </div>
              {stats.normal.levelsCompleted > 0 ? (
                <>
                  <div className="text-lg font-bold" style={{ color: getRankColor(stats.normal.bestRank).text.replace('text-', 'hsl(var(--') + ')' }}>
                    {stats.normal.bestRank}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.normal.levelsCompleted}/10 levels
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground italic">Not played</div>
              )}
            </div>
            
            {/* Challenge Mode Stats */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-xs font-medium text-muted-foreground">Challenge</span>
              </div>
              {stats.challenge.levelsCompleted > 0 ? (
                <>
                  <div className="text-lg font-bold" style={{ color: getRankColor(stats.challenge.bestRank).text.replace('text-', 'hsl(var(--') + ')' }}>
                    {stats.challenge.bestRank}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.challenge.levelsCompleted}/10 levels
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground italic">Not played</div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons - Show when unlocked with progress OR when all chapters unlocked */}
        {shouldShowButtons && !isCompleted && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
            {hasProgress ? (
              // Has progress: Continue button
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
            ) : (
              // No progress but all unlocked: Start button
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onStart?.();
                }}
                className="w-full"
                style={{
                  background: chapter.theme.primary,
                  color: 'white',
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Chapter
              </Button>
            )}
            
            {/* Restart button - always show when buttons are visible */}
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

        {/* Buttons for Completed Chapters */}
        {isUnlocked && isCompleted && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
            {allChaptersUnlocked && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onStart?.();
                }}
                className="w-full"
                style={{
                  background: chapter.theme.primary,
                  color: 'white',
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Chapter
              </Button>
            )}
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
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these change
  return (
    prevProps.chapter.id === nextProps.chapter.id &&
    prevProps.isUnlocked === nextProps.isUnlocked &&
    prevProps.allChaptersUnlocked === nextProps.allChaptersUnlocked &&
    prevProps.difficulty === nextProps.difficulty &&
    prevProps.stats?.normal.levelsCompleted === nextProps.stats?.normal.levelsCompleted &&
    prevProps.stats?.challenge.levelsCompleted === nextProps.stats?.challenge.levelsCompleted &&
    prevProps.stats?.normal.bestScore === nextProps.stats?.normal.bestScore &&
    prevProps.stats?.challenge.bestScore === nextProps.stats?.challenge.bestScore &&
    prevProps.currentLevelInChapter === nextProps.currentLevelInChapter
  );
});
