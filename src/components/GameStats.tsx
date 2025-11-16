import { Radio, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { InfoTooltip } from './InfoTooltip';
import { getChapterConfig } from '@/lib/game/chapters';
import { Progress } from '@/components/ui/progress';

export interface GameStatsProps {
  pingsRemaining: number;
  pingsUsed: number;
  elapsedTime: number;
  finalTime: number | null;
  timerEnabled: boolean;
  pingsMode?: 'limited' | 'unlimited';
  levelInfo?: {
    chapter: number;
    level: number;
  };
}

export function GameStats({
  pingsRemaining,
  pingsUsed,
  elapsedTime,
  finalTime,
  timerEnabled,
  pingsMode = 'limited',
  levelInfo,
}: GameStatsProps) {
  const isMobile = useIsMobile();
  
  // Check if this is a boss level
  const isBossLevel = levelInfo ? levelInfo.level % 10 === 0 : false;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (time: number) => {
    if (time < 30) return 'text-accent';
    if (time < 60) return 'text-foreground';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn(
      "grid gap-3",
      levelInfo 
        ? (isMobile ? "grid-cols-2" : "grid-cols-4")
        : timerEnabled 
          ? (isMobile ? "grid-cols-2" : "grid-cols-3")
          : "grid-cols-2"  // Tutorial mode: only pings, no timer, no level
    )}>
      {/* Level Info (Classic Mode Only) */}
      {levelInfo && (
        <div className="flat-card bg-secondary/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-tiny text-muted-foreground uppercase tracking-wider font-medium">
              Progress
            </div>
            {isBossLevel && (
              <div className="text-tiny font-bold text-accent bg-accent/20 px-2 py-0.5 rounded">
                BOSS LEVEL
              </div>
            )}
            {(() => {
              const chapterConfig = getChapterConfig(levelInfo.chapter);
              if (chapterConfig.specialMechanic) {
                const mechanicDescriptions: Record<string, string> = {
                  shrinking_target: 'Target shrinks after each ping',
                  moving_target: 'Target moves after each ping',
                  phantom_targets: 'Decoy targets appear',
                  combined_challenge: 'All mechanics combined!',
                };
                return (
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <InfoTooltip content={mechanicDescriptions[chapterConfig.specialMechanic] || chapterConfig.specialMechanic} />
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <div className="text-xl font-display font-semibold text-foreground">
            {getChapterConfig(levelInfo.chapter).name}
          </div>
          <div className="text-sm text-muted-foreground">
            Level {levelInfo.level}
          </div>
          {/* Mini Progress Bar */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Chapter</span>
              <span className="font-medium text-foreground">
                {((levelInfo.level - 1) % 10) + 1}/10
              </span>
            </div>
            <Progress 
              value={((((levelInfo.level - 1) % 10) + 1) / 10) * 100} 
              className="h-1.5"
            />
          </div>
        </div>
      )}

      {/* Pings Stat */}
      <div className="flat-card bg-primary/10 backdrop-blur-sm border-primary/20">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-4 h-4 text-primary" />
          <div className="text-tiny text-muted-foreground uppercase tracking-wider font-medium">
            {pingsMode === 'unlimited' ? 'Pings Used' : 'Pings Left'}
          </div>
        </div>
        <div className={cn(
          "text-xl font-display font-semibold",
          pingsMode === 'unlimited' ? 'text-foreground' : 
          pingsRemaining === 0 ? 'text-destructive' : 'text-primary'
        )}>
          {pingsMode === 'unlimited' ? pingsUsed : pingsRemaining}
        </div>
      </div>

      {/* Timer (if enabled) */}
      {timerEnabled && (
        <div className="flat-card bg-accent/10 backdrop-blur-sm border-accent/20">
          <div className="text-tiny text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Time
          </div>
          <div className={cn(
            "text-xl font-display font-semibold font-mono",
            finalTime !== null ? 'text-foreground' : getTimeColor(elapsedTime)
          )}>
            {formatTime(finalTime ?? elapsedTime)}
          </div>
        </div>
      )}

      {/* Total Pings Used (for unlimited mode or as additional stat) */}
      {(pingsMode === 'limited' || !timerEnabled) && (
        <div className="flat-card bg-secondary/50 backdrop-blur-sm">
          <div className="text-tiny text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Pings Used
          </div>
          <div className="text-xl font-display font-semibold text-foreground">
            {pingsUsed}
          </div>
        </div>
      )}
    </div>
  );
}
