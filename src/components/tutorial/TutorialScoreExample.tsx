import { Trophy, Clock, Target, Zap } from 'lucide-react';

export function TutorialScoreExample() {
  return (
    <div className="space-y-4 animate-scale-in">
      {/* Rank Badge */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-600/20 border-2 border-orange-500/50">
          <span className="text-3xl font-bold text-orange-400">C</span>
        </div>
        <div className="text-left">
          <div className="text-sm text-muted-foreground">Total Score</div>
          <div className="text-3xl font-bold">511</div>
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
          <div className="text-2xl font-bold text-echo-success">+51</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="flat-card p-4 space-y-2">
        <h3 className="text-sm font-semibold mb-3">Score Breakdown</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Accuracy Score (92% × 5)</span>
            <span className="font-medium text-echo-success">+460</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ping Efficiency (2 unused)</span>
            <span className="font-medium text-echo-success">+66</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time Score (28.5s)</span>
            <span className="font-medium text-destructive">-15</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-bold">
            <span>Final Score</span>
            <span>511</span>
          </div>
        </div>
      </div>

      {/* Scoring Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• <span className="font-medium">Accuracy is mandatory:</span> 5 points per percent proximity (up to +500)</p>
        <p>• <span className="font-medium">Conserve pings:</span> Unused pings increase your efficiency bonus (up to +200)</p>
        <p>• <span className="font-medium">Time Performance:</span> Fast times (&lt;15s) earn bonuses, slow times (&gt;40s) get heavy penalties</p>
        <p>• <span className="font-medium">Chapter Mechanics:</span> In Chapters 2+, master special mechanics for +100-200 bonus points</p>
        <p>• <span className="font-medium">Boss Levels:</span> Level 10 of each chapter awards +150 bonus for A rank or better</p>
        <p>• <span className="font-medium">No Base Score:</span> Your performance is everything—accuracy is the foundation!</p>
        <p>• <span className="font-medium">Achieve B rank or better</span> (700+ points) to progress to the next level</p>
      </div>
    </div>
  );
}
