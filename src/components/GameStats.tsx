import { Radio } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
      isMobile ? "grid-cols-2" : levelInfo ? "grid-cols-4" : "grid-cols-3"
    )}>
      {/* Level Info (Classic Mode Only) */}
      {levelInfo && (
        <div className="flat-card bg-secondary/50 backdrop-blur-sm">
          <div className="text-tiny text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Progress
          </div>
          <div className="text-xl font-display font-semibold text-foreground">
            Ch. {levelInfo.chapter} • Lvl. {levelInfo.level}
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
