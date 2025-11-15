import { Trophy, Clock, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostRoundSummaryProps {
  score: any;
  proximity: number;
  pingsUsed: number;
  timeElapsed: number;
  onNext: () => void;
  onRetry: () => void;
  onMenu: () => void;
}

export function PostRoundSummary({
  score,
  proximity,
  pingsUsed,
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Score</span>
              <span>+{score.components.base}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proximity Bonus</span>
              <span className="text-accent">+{score.components.proximityBonus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unused Pings</span>
              <span className="text-accent">+{score.components.unusedPingBonus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time Penalty</span>
              <span className="text-destructive">-{score.components.timePenalty}</span>
            </div>
          </div>
        </div>

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
