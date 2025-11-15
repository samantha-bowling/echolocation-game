import { Trophy, Clock, Target, Zap, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/InfoTooltip';
import { getNextRankInfo, getPointsToNextRank, getProgressToNextRank, generateStrategicTips } from '@/lib/game/scoring';

interface PostRoundSummaryProps {
  score: any;
  proximity: number;
  pingsUsed: number;
  totalPings: number;
  timeElapsed: number;
  onNext: () => void;
  onRetry: () => void;
  onMenu: () => void;
}

export function PostRoundSummary({
  score,
  proximity,
  pingsUsed,
  totalPings,
  timeElapsed,
  onNext,
  onRetry,
  onMenu,
}: PostRoundSummaryProps) {
  const success = proximity >= 80;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 echo-dots">
      <div className="frosted-modal max-w-2xl w-full space-y-8 animate-scale-in">
        {/* Rank */}
        <div className="text-center space-y-2">
          <div 
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl font-display font-bold ${
              success ? 'bg-echo-success/20 text-accent' : 'bg-destructive/20 text-destructive'
            }`}
          >
            {score.rank}
          </div>
          <p className="text-heading-2">{score.flavorText}</p>
          <p className="text-muted-foreground">
            {success 
              ? `Proximity ≥80% - Level Complete!` 
              : `${proximity}% Proximity - Need 80% to advance`
            }
          </p>
        </div>

        {/* Rank Progression */}
        <div className="flat-card space-y-3">
          <div className="flex items-center justify-between text-tiny text-muted-foreground">
            <span>CURRENT RANK</span>
            <span>NEXT RANK</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-xl font-display font-bold text-primary">
              {score.rank}
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${getProgressToNextRank(score.total, score.rank)}%` }}
                />
              </div>
              <div className="flex justify-between text-tiny">
                <span className="text-foreground font-mono">{score.total}</span>
                {getNextRankInfo(score.rank) && (
                  <span className="text-muted-foreground">
                    {getNextRankInfo(score.rank)!.threshold} for {getNextRankInfo(score.rank)!.rank}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {getPointsToNextRank(score.total, score.rank) > 0 && (
            <p className="text-tiny text-center text-muted-foreground">
              <span className="text-accent font-semibold">+{getPointsToNextRank(score.total, score.rank)}</span> points to rank up
            </p>
          )}
        </div>

        {/* Score */}
        <div className="text-center">
          <p className="text-tiny text-muted-foreground uppercase tracking-wider mb-2">
            Total Score
          </p>
          <p className="text-display text-primary font-mono">{score.total}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flat-card text-center space-y-2">
            <Target className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-tiny text-muted-foreground">Proximity</p>
            <p className="text-heading-2 font-mono">{proximity}%</p>
          </div>

          <div className="flat-card text-center space-y-2">
            <Zap className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-tiny text-muted-foreground">Pings Used</p>
            <p className="text-heading-2 font-mono">{pingsUsed}</p>
          </div>

          <div className="flat-card text-center space-y-2">
            <Clock className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-tiny text-muted-foreground">Time</p>
            <p className="text-heading-2 font-mono">{timeElapsed.toFixed(1)}s</p>
          </div>

          <div className="flat-card text-center space-y-2">
            <Trophy className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-tiny text-muted-foreground">Bonus</p>
            <p className="text-heading-2 font-mono">+{score.components.unusedPingBonus}</p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="flat-card space-y-3">
          <p className="text-small font-semibold">Score Breakdown</p>
          <div className="space-y-2 text-small font-mono">
            {/* Base Score */}
            <div className="flex justify-between items-center group">
              <span className="text-muted-foreground flex items-center gap-2">
                Base Score
                <InfoTooltip content="Every round starts with 1,000 base points" />
              </span>
              <span>+{score.components.base}</span>
            </div>

            {/* Proximity Bonus with Formula */}
            <div className="flex justify-between items-center group">
              <span className="text-muted-foreground flex items-center gap-2">
                Proximity ({proximity}% × 4)
                <InfoTooltip content="Earn 4 points for each percent of proximity. Max 400 points at 100%." />
              </span>
              <span className="text-accent">+{score.components.proximityBonus}</span>
            </div>

            {/* Ping Efficiency with Formula */}
            <div className="flex justify-between items-center group">
              <span className="text-muted-foreground flex items-center gap-2">
                Ping Efficiency ({totalPings - pingsUsed}/{totalPings} unused)
                <InfoTooltip content="Save pings to earn bonus points! Max 300 points for perfect efficiency." />
              </span>
              <span className="text-accent">+{score.components.pingEfficiencyBonus}</span>
            </div>

            {/* Time Penalty with Formula */}
            <div className="flex justify-between items-center group">
              <span className="text-muted-foreground flex items-center gap-2">
                Time Penalty ({timeElapsed.toFixed(1)}s × -2)
                <InfoTooltip content="You lose 2 points per second. Max penalty: -500 points." />
              </span>
              <span className="text-destructive">-{score.components.timePenalty}</span>
            </div>

            {/* Speed Bonus (if earned) */}
            {score.components.speedBonus > 0 && (
              <div className="flex justify-between items-center group">
                <span className="text-muted-foreground flex items-center gap-2">
                  ⚡ Speed Bonus
                  <InfoTooltip content="Complete in under 15 seconds for bonus points!" />
                </span>
                <span className="text-echo-success">+{score.components.speedBonus}</span>
              </div>
            )}

            {/* Perfect Target Bonus (if earned) */}
            {score.components.perfectTargetBonus > 0 && (
              <div className="flex justify-between items-center group">
                <span className="text-muted-foreground flex items-center gap-2">
                  🎯 Perfect Target!
                  <InfoTooltip content="100% proximity accuracy bonus!" />
                </span>
                <span className="text-echo-success">+{score.components.perfectTargetBonus}</span>
              </div>
            )}

            {/* Difficulty Multiplier */}
            {score.components.difficultyMultiplier !== 1.0 && (
              <div className="flex justify-between items-center group border-t border-border pt-2 mt-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  Difficulty (×{score.components.difficultyMultiplier})
                  <InfoTooltip content="Higher difficulty levels multiply your score!" />
                </span>
                <span className="text-accent font-semibold">×{score.components.difficultyMultiplier}</span>
              </div>
            )}
          </div>
        </div>

        {/* Strategic Tips */}
        {(() => {
          const tips = generateStrategicTips(score, proximity, pingsUsed, totalPings, timeElapsed);
          return tips.length > 0 ? (
            <div className="flat-card bg-muted/30 space-y-2">
              <p className="text-tiny text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5" />
                Tips for Improvement
              </p>
              <div className="space-y-1 text-small">
                {tips.map((tip, i) => (
                  <p key={i} className="text-foreground/80">• {tip}</p>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {success && (
            <Button 
              onClick={onNext} 
              size="lg"
              className="w-full h-12"
            >
              Next Level
            </Button>
          )}
          
          <button onClick={onRetry} className="ghost-button w-full h-12">
            Retry Level
          </button>
          
          <button onClick={onMenu} className="ghost-button w-full h-12">
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
