import { Trophy, Clock, Target, Zap } from 'lucide-react';

export function TutorialScoreExample() {
  return (
    <div className="frosted-modal max-w-xl w-full space-y-4 animate-scale-in">
      {/* Rank Badge */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-500/50">
          <span className="text-3xl font-bold text-yellow-400">A</span>
        </div>
        <div className="text-left">
          <div className="text-sm text-muted-foreground">Total Score</div>
          <div className="text-3xl font-bold">1,250</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flat-card p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Proximity</span>
          </div>
          <div className="text-2xl font-bold">92%</div>
        </div>

        <div className="flat-card p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Pings</span>
          </div>
          <div className="text-2xl font-bold">4/6</div>
        </div>

        <div className="flat-card p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Time</span>
          </div>
          <div className="text-2xl font-bold">28.5s</div>
        </div>

        <div className="flat-card p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Bonus</span>
          </div>
          <div className="text-2xl font-bold text-echo-success">+120</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="flat-card p-4 space-y-2">
        <h3 className="text-sm font-semibold mb-3">Score Breakdown</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Score</span>
            <span className="font-medium">500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Accuracy Bonus (92% × 4)</span>
            <span className="font-medium text-echo-success">+368</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ping Efficiency (2 unused)</span>
            <span className="font-medium text-echo-success">+60</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Speed Bonus (&lt; 30s)</span>
            <span className="font-medium text-echo-success">+50</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-muted-foreground">Time Penalty (graduated)</span>
            <span className="font-medium text-destructive">-28</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-bold">
            <span>Final Score</span>
            <span>1,250</span>
          </div>
        </div>
      </div>

      {/* Scoring Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• <span className="font-medium">Closer is better:</span> Higher proximity = more points</p>
        <p>• <span className="font-medium">Save pings:</span> Each unused ping earns +30 points</p>
        <p>• <span className="font-medium">Be quick:</span> First 15s have minimal penalty, then increases gradually</p>
        <p>• <span className="font-medium">Complete chapters:</span> Finish all 10 levels for a bonus</p>
      </div>
    </div>
  );
}
