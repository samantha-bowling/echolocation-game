import { Trophy, Target, Clock, Zap, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { loadCustomStats } from '@/lib/game/customStats';

export function CustomStats() {
  const navigate = useNavigate();
  const stats = loadCustomStats();
  
  const winRate = stats.gamesWon + stats.gamesLost > 0
    ? Math.round((stats.gamesWon / (stats.gamesWon + stats.gamesLost)) * 100)
    : 0;
  
  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/custom')}
          className="gap-2"
        >
          ← Back to Custom Mode
        </Button>
        
        <div className="text-center space-y-2">
          <h1 className="text-display">Custom Game Statistics</h1>
          <p className="text-muted-foreground">
            Track your performance across all custom game configurations
          </p>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flat-card text-center space-y-2">
          <BarChart3 className="w-8 h-8 mx-auto text-primary" />
          <p className="text-tiny text-muted-foreground">Total Games</p>
          <p className="text-heading-1">{stats.totalGames}</p>
        </div>
        
        <div className="flat-card text-center space-y-2">
          <Trophy className="w-8 h-8 mx-auto text-accent" />
          <p className="text-tiny text-muted-foreground">Best Score</p>
          <p className="text-heading-1">{stats.bestScore}</p>
        </div>
        
        <div className="flat-card text-center space-y-2">
          <Target className="w-8 h-8 mx-auto text-echo-success" />
          <p className="text-tiny text-muted-foreground">Best Proximity</p>
          <p className="text-heading-1">{stats.bestProximity}%</p>
        </div>
        
        <div className="flat-card text-center space-y-2">
          <TrendingUp className="w-8 h-8 mx-auto text-primary" />
          <p className="text-tiny text-muted-foreground">Win Rate</p>
          <p className="text-heading-1">{winRate}%</p>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto">
        <h2 className="text-heading-2 mb-4">Milestones</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flat-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-heading-2">{stats.perfectGames}</p>
              <p className="text-tiny text-muted-foreground">Perfect Games</p>
            </div>
          </div>
          
          <div className="flat-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-heading-2">{stats.speedrunGames}</p>
              <p className="text-tiny text-muted-foreground">Speed Runs (&lt;10s)</p>
            </div>
          </div>
          
          <div className="flat-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-echo-success/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-echo-success" />
            </div>
            <div>
              <p className="text-heading-2">{stats.efficientGames}</p>
              <p className="text-tiny text-muted-foreground">Perfect Efficiency</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-heading-2">Performance by Mode</h2>
          <div className="space-y-3">
            {Object.entries(stats.statsByMode).map(([mode, data]) => (
              <div key={mode} className="flat-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold capitalize">{mode} Pings</h3>
                  <span className="text-tiny text-muted-foreground">
                    {data.gamesPlayed} games
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-tiny text-muted-foreground">Best</p>
                    <p className="text-heading-3 font-mono">{data.bestScore}</p>
                  </div>
                  <div>
                    <p className="text-tiny text-muted-foreground">Average</p>
                    <p className="text-heading-3 font-mono">{data.averageScore}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-heading-2">Performance by Arena</h2>
          <div className="space-y-3">
            {Object.entries(stats.statsByArena).map(([arena, data]) => (
              <div key={arena} className="flat-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold capitalize">{arena}</h3>
                  <span className="text-tiny text-muted-foreground">
                    {data.gamesPlayed} games
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-tiny text-muted-foreground">Best</p>
                    <p className="text-heading-3 font-mono">{data.bestScore}</p>
                  </div>
                  <div>
                    <p className="text-tiny text-muted-foreground">Average</p>
                    <p className="text-heading-3 font-mono">{data.averageScore}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto">
        <h2 className="text-heading-2 mb-4">Recent Games</h2>
        <div className="flat-card overflow-x-auto">
          <table className="w-full text-small">
            <thead className="border-b border-border">
              <tr className="text-left text-tiny text-muted-foreground">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Score</th>
                <th className="pb-3 pr-4">Proximity</th>
                <th className="pb-3 pr-4">Pings</th>
                <th className="pb-3 pr-4">Time</th>
                <th className="pb-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recentGames.slice(0, 10).map((game, i) => (
                <tr key={i} className="hover:bg-card/30 transition-colors">
                  <td className="py-3 pr-4 text-muted-foreground">
                    {new Date(game.timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4 font-mono">{game.score}</td>
                  <td className="py-3 pr-4 font-mono">{game.proximity}%</td>
                  <td className="py-3 pr-4 font-mono">{game.pingsUsed}</td>
                  <td className="py-3 pr-4 font-mono">
                    {game.timeElapsed > 0 ? `${game.timeElapsed.toFixed(1)}s` : '-'}
                  </td>
                  <td className="py-3">
                    {game.passedCondition === true && (
                      <span className="text-echo-success">✓ Won</span>
                    )}
                    {game.passedCondition === false && (
                      <span className="text-destructive">✗ Lost</span>
                    )}
                    {game.passedCondition === undefined && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
