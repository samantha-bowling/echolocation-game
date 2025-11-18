import { Trophy, Clock, Target, Zap } from 'lucide-react';

export function TutorialScoreExample() {
  return (
    <div className="space-y-4 animate-scale-in">
      {/* Rank Badge */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-500/50">
          <span className="text-3xl font-bold text-yellow-400">A</span>
        </div>
        <div className="text-left">
          <div className="text-sm text-muted-foreground">Total Score</div>
          <div className="text-3xl font-bold">1,042</div>
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
          <div className="text-2xl font-bold text-echo-success">+106</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="flat-card p-4 space-y-2">
        <h3 className="text-sm font-semibold mb-3">Score Breakdown</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Score</span>
            <span className="font-medium">200</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Proximity Bonus (92% × 8)</span>
            <span className="font-medium text-echo-success">+736</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ping Efficiency (2 unused)</span>
            <span className="font-medium text-echo-success">+133</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time Performance (28.5s)</span>
            <span className="font-medium text-destructive">-27</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-bold">
            <span>Final Score</span>
            <span>1,042</span>
          </div>
        </div>
      </div>

      {/* Scoring Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• <span className="font-medium">Proximity matters most:</span> 8 points per percent (up to +800)</p>
        <p>• <span className="font-medium">Save pings:</span> Higher efficiency bonus for unused pings (up to +400)</p>
        <p>• <span className="font-medium">Time Performance:</span> Fast times (&lt;10s) earn bonuses, slow times (&gt;30s) get penalties</p>
        <p>• <span className="font-medium">Chapter Mechanics:</span> In Chapters 2+, master special mechanics for +100-200 bonus points</p>
        <p>• <span className="font-medium">Boss Levels:</span> Level 10 of each chapter is extra challenging and awards +150 bonus for B rank or better</p>
        <p>• <span className="font-medium">No Participation Points:</span> Scores are skill-based—completion is its own reward!</p>
        <p>• <span className="font-medium">Achieve B rank or better</span> (800+ points) to progress to the next level</p>
      </div>
    </div>
  );
}
