import { Radio, Volume2, Shield, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { getChapterConfig } from '@/lib/game/chapters';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Boon } from '@/lib/game/boons';
import { getHeaderBadges, getBadgeClasses } from '@/lib/game/headerBadges';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface GameStatsProps {
  pingsRemaining: number;
  pingsUsed: number;
  elapsedTime: number;
  finalTime: number | null;
  timerEnabled: boolean;
  pingsMode?: 'limited' | 'unlimited';
  replaysRemaining?: number;
  replaysAvailable?: number;
  levelInfo?: {
    chapter: number;
    level: number;
  };
  activeBoon?: Boon;
  difficulty?: 'normal' | 'challenge';
}

export function GameStats({
  pingsRemaining,
  pingsUsed,
  elapsedTime,
  finalTime,
  timerEnabled,
  pingsMode = 'limited',
  replaysRemaining,
  replaysAvailable,
  levelInfo,
  activeBoon,
  difficulty,
}: GameStatsProps) {
  const isMobile = useIsMobile();
  
  // Generate badges using registry
  const badges = levelInfo ? getHeaderBadges(
    levelInfo.level,
    levelInfo.chapter,
    getChapterConfig(levelInfo.chapter).specialMechanic
  ) : [];
  
  const maxVisibleBadges = isMobile ? 1 : 3;
  
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
    <div className="space-y-3">
      {/* Tier 1: Progress Banner (Classic Mode Only) */}
      {levelInfo && (
        <div className="flat-card bg-secondary/50 backdrop-blur-sm">
          <div className={cn(
            "flex gap-4",
            isMobile ? "flex-col items-start" : "items-center justify-between"
          )}>
            {/* Left: Chapter + Level */}
            <div className={cn(
              "flex flex-col gap-1",
              isMobile && "w-full"
            )}>
              <div className="text-2xl font-display font-semibold text-foreground truncate">
                {getChapterConfig(levelInfo.chapter).name}
              </div>
              <div className="text-sm text-muted-foreground">
                Level {levelInfo.level}
              </div>
            </div>

            {/* Center: Progress Bar + Difficulty Badge + Active Boon */}
            <div className={cn(
              "space-y-2",
              isMobile ? "w-full" : "flex-1 max-w-md px-6"
            )}>
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Chapter Progress</span>
                  <span className="font-medium text-foreground">
                    {((levelInfo.level - 1) % 10) + 1}/10
                  </span>
                </div>
                <Progress 
                  value={((((levelInfo.level - 1) % 10) + 1) / 10) * 100} 
                  className="h-2"
                />
              </div>
              
              {/* Difficulty Badge + Active Boon Row */}
              <div className="flex items-center justify-center gap-3">
                {/* Difficulty Badge */}
                {difficulty && (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                    style={{
                      background: difficulty === 'normal' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                      borderColor: difficulty === 'normal' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(234, 179, 8, 0.3)',
                      color: difficulty === 'normal' ? 'rgb(59, 130, 246)' : 'rgb(234, 179, 8)',
                    }}
                  >
                    {difficulty === 'normal' ? (
                      <>
                        <Shield className="w-3 h-3" />
                        <span>Normal</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>Challenge</span>
                      </>
                    )}
                  </div>
                )}
                
                {/* Active Boon Indicator */}
                {activeBoon && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-lg">{activeBoon.icon}</span>
                    <span>
                      <span className="text-foreground font-medium">{activeBoon.name}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Badges with Overflow */}
            <div className={cn(
              "flex items-center gap-2 flex-shrink-0",
              isMobile && "w-full flex-wrap"
            )}>
              {badges.slice(0, maxVisibleBadges).map(badge => (
                badge.tooltip ? (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <div className={getBadgeClasses(badge.variant)}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{badge.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={badge.id} className={getBadgeClasses(badge.variant)}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>
                )
              ))}
              
              {badges.length > maxVisibleBadges && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-tiny">
                      +{badges.length - maxVisibleBadges}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="flex flex-col gap-2">
                      {badges.slice(maxVisibleBadges).map(badge => (
                        badge.tooltip ? (
                          <Tooltip key={badge.id}>
                            <TooltipTrigger asChild>
                              <div className={getBadgeClasses(badge.variant)}>
                                {badge.icon}
                                <span>{badge.label}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{badge.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div key={badge.id} className={getBadgeClasses(badge.variant)}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tier 2: Stats Row */}
      <div className={cn(
        "grid gap-3",
        levelInfo 
          ? (isMobile ? "grid-cols-2" : "grid-cols-4")
          : timerEnabled 
            ? (isMobile ? "grid-cols-2" : "grid-cols-3")
            : "grid-cols-2"  // Tutorial mode: only pings, no timer, no level
      )}>

        {/* Pings Stat */}
        <div className="flat-card bg-primary/10 backdrop-blur-sm border-primary/20 p-4">
        <div className="flex flex-col items-center text-center space-y-1">
          <div className="flex items-center gap-2 mb-0.5">
            <Radio className="w-3.5 h-3.5 text-primary" />
            <div className="text-tiny text-muted-foreground uppercase tracking-wider font-medium">
              {pingsMode === 'unlimited' ? 'Pings Used' : 'Pings Left'}
            </div>
          </div>
          <div className={cn(
            "text-2xl font-display font-semibold",
            pingsMode === 'unlimited' ? 'text-foreground' : 
            pingsRemaining === 0 ? 'text-destructive' : 'text-primary'
          )}>
            {pingsMode === 'unlimited' ? pingsUsed : pingsRemaining}
          </div>
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
          <div className="flat-card bg-secondary/50 backdrop-blur-sm p-4">
            <div className="flex flex-col items-center text-center space-y-1">
              <div className="text-tiny text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                Pings Used
              </div>
              <div className="text-2xl font-display font-semibold text-foreground">
                {pingsUsed}
              </div>
            </div>
          </div>
        )}

        {/* Replays Remaining (when available) */}
        {replaysAvailable !== undefined && (replaysAvailable > 0 || replaysAvailable === -1) && (
          <div className="flat-card bg-accent/10 backdrop-blur-sm border-accent/20 p-4">
            <div className="flex flex-col items-center text-center space-y-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Volume2 className="w-3.5 h-3.5 text-accent" />
                <div className="text-tiny text-muted-foreground uppercase tracking-wider font-medium">
                  Replays
                </div>
              </div>
              <div className={cn(
                "text-2xl font-display font-semibold",
                replaysRemaining === 0 ? 'text-muted-foreground' : 'text-accent'
              )}>
                {replaysRemaining === -1 ? '∞' : replaysRemaining}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
