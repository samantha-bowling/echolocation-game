import { Trophy, Clock, Target, Zap, Lightbulb, Share2, Copy, Check, X, Volume2, PartyPopper, HeartCrack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/InfoTooltip';
import { getNextRankInfo, getPointsToNextRank, getProgressToNextRank, generateStrategicTips, getRankColor } from '@/lib/game/scoring';
import { CustomGameConfig, encodeConfigToShareCode } from '@/lib/game/customConfig';
import { useState } from 'react';

interface PostRoundSummaryProps {
  score: any;
  proximity: number;
  pingsUsed: number;
  totalPings: number;
  timeElapsed: number;
  completionBonus?: number;
  onNext: () => void;
  onRetry: () => void;
  onMenu: () => void;
  onClose?: () => void;
  isCustomGame?: boolean;
  winCondition?: CustomGameConfig['winCondition'];
  passedCondition?: boolean;
  config?: CustomGameConfig;
  replaysUsed?: number;
  replaysAvailable?: number;
}

export function PostRoundSummary({
  score,
  proximity,
  pingsUsed,
  totalPings,
  timeElapsed,
  completionBonus = 0,
  onNext,
  onRetry,
  onMenu,
  onClose,
  isCustomGame,
  winCondition,
  passedCondition,
  config,
  replaysUsed = 0,
  replaysAvailable,
}: PostRoundSummaryProps) {
  const success = proximity >= 80;
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const shareCode = isCustomGame && config ? encodeConfigToShareCode(config) : '';

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const getFailureMotivation = () => {
    if (!winCondition) return "Try again!";
    
    const messages = [
      "So close! You'll get it next time.",
      "Practice makes perfect. Try again!",
      "Every attempt brings you closer to success.",
      "Don't give up! You're improving.",
      "Learn from this round and come back stronger!",
    ];
    
    if (winCondition.type === 'proximity' && proximity >= (winCondition.proximityThreshold || 80) - 10) {
      return "You were so close! Just a bit more accuracy needed.";
    }
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-black/50 animate-fade-in">
      <div className="frosted-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 animate-scale-in relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close summary"
          >
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        )}

        {/* Win/Fail Banner for Custom Games */}
        {isCustomGame && passedCondition !== undefined && (
          <div className={`flat-card text-center space-y-2 p-6 animate-scale-in ${
            passedCondition 
              ? 'bg-gradient-to-br from-echo-success/10 to-emerald-500/10 border-echo-success/30' 
              : 'bg-gradient-to-br from-destructive/10 to-rose-500/10 border-destructive/30'
          }`}>
            <div className={`flex items-center justify-center ${passedCondition ? 'animate-bounce' : ''}`}>
              {passedCondition ? <PartyPopper className="w-16 h-16 text-echo-success" /> : <HeartCrack className="w-16 h-16 text-destructive" />}
            </div>
            <h2 className={`text-heading-1 ${
              passedCondition ? 'text-echo-success' : 'text-destructive'
            }`}>
              {passedCondition ? 'Challenge Complete!' : 'Challenge Failed'}
            </h2>
            
            {winCondition && winCondition.type !== 'none' && (
              <div className="text-small text-muted-foreground space-y-1">
                {winCondition.type === 'proximity' && (
                  <>
                    <p>Required: {winCondition.proximityThreshold}% proximity or better</p>
                    <p className={passedCondition ? 'text-echo-success' : 'text-destructive'}>
                      Achieved: {proximity}% proximity
                      {passedCondition && ' ✓'}
                    </p>
                  </>
                )}
              </div>
            )}
            
            {!passedCondition && (
              <p className="text-small text-foreground/80 italic">
                {getFailureMotivation()}
              </p>
            )}
          </div>
        )}

        {/* Rank */}
        <div className="text-center space-y-2">
          <div 
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-3xl font-display font-bold border-2 ${
              getRankColor(score.rank).bg
            } ${
              getRankColor(score.rank).text
            } ${
              getRankColor(score.rank).border
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
            <div className={`flex items-center justify-center w-12 h-12 rounded-lg text-xl font-display font-bold border ${
              getRankColor(score.rank).bg
            } ${
              getRankColor(score.rank).text
            } ${
              getRankColor(score.rank).border
            }`}>
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
          <p className="text-5xl text-primary font-mono">{score.total}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flat-card text-center space-y-1">
            <Target className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-tiny text-muted-foreground">Proximity</p>
            <p className="text-heading-2 font-mono">{proximity}%</p>
          </div>

          <div className="flat-card text-center space-y-1">
            <Zap className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-tiny text-muted-foreground">Pings Used</p>
            <p className="text-heading-2 font-mono">{pingsUsed}</p>
          </div>

          <div className="flat-card text-center space-y-1">
            <Clock className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-tiny text-muted-foreground">Time</p>
            <p className="text-heading-2 font-mono">{timeElapsed.toFixed(1)}s</p>
          </div>

          <div className="flat-card text-center space-y-1">
            <Trophy className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-tiny text-muted-foreground">Bonus</p>
            <p className="text-heading-2 font-mono">+{score.components.unusedPingBonus}</p>
          </div>
        </div>

        {/* Enhanced Score Breakdown */}
        <div className="flat-card space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            <h3 className="text-heading-2">Score Breakdown</h3>
          </div>
          
          <div className="space-y-3">
            {/* Positive Components - Green theme */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                Earned Points
              </div>
              
              <ScoreBreakdownItem 
                label="Base Score"
                value={score.components.base}
                isPositive={true}
              />
              
              {score.components.proximityBonus > 0 && (
                <ScoreBreakdownItem 
                  label="Accuracy Bonus"
                  value={score.components.proximityBonus}
                  isPositive={true}
                  detail={`${proximity.toFixed(1)}% proximity × 4`}
                />
              )}
              
              {score.components.pingEfficiencyBonus > 0 && (
                <ScoreBreakdownItem 
                  label="Ping Efficiency"
                  value={score.components.pingEfficiencyBonus}
                  isPositive={true}
                  detail={`${totalPings - pingsUsed} unused pings`}
                />
              )}
              
              {score.components.earlyGuessBonus > 0 && (
                <ScoreBreakdownItem 
                  label="Early Guess Bonus"
                  value={score.components.earlyGuessBonus}
                  isPositive={true}
                  detail={`Guessed ${totalPings - pingsUsed} pings early`}
                  highlight={true}
                />
              )}
              
              {score.components.speedBonus > 0 && (
                <ScoreBreakdownItem 
                  label="Speed Bonus"
                  value={score.components.speedBonus}
                  isPositive={true}
                  detail={`Completed in ${timeElapsed.toFixed(1)}s`}
                />
              )}
              
              {score.components.perfectTargetBonus > 0 && (
                <ScoreBreakdownItem 
                  label="Perfect Hit"
                  value={score.components.perfectTargetBonus}
                  isPositive={true}
                  highlight={true}
                />
              )}
              
            {score.components.boonBonus > 0 && (
              <ScoreBreakdownItem 
                label="Boon Bonus"
                value={score.components.boonBonus}
                isPositive={true}
              />
            )}

            {score.components.replayBonus > 0 && (
              <ScoreBreakdownItem 
                label="Replay Conservation"
                value={score.components.replayBonus}
                isPositive={true}
                detail={`${(replaysAvailable || 0) - replaysUsed} replays unused`}
                highlight={true}
              />
            )}

            {completionBonus > 0 && (
              <ScoreBreakdownItem 
                label="Chapter Complete!"
                value={completionBonus}
                isPositive={true}
                detail="All 10 levels finished"
                highlight={true}
              />
            )}
          </div>
            
            {/* Negative Components - Red theme */}
            {score.components.timePenalty > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="text-xs font-semibold text-rose-400 uppercase tracking-wide">
                  Deductions
                </div>
                <ScoreBreakdownItem 
                  label="Time Penalty"
                  value={score.components.timePenalty}
                  isPositive={false}
                  detail={`${timeElapsed.toFixed(1)}s × 2`}
                />
              </div>
            )}
            
            {/* Multiplier */}
            {score.components.difficultyMultiplier !== 1.0 && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between items-center text-small">
                  <span className="text-muted-foreground">Difficulty Multiplier</span>
                  <span className="font-mono text-accent">
                    ×{score.components.difficultyMultiplier.toFixed(1)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Final Total */}
            <div className="pt-3 border-t-2 border-accent/30">
              <div className="flex justify-between items-center">
                <span className="text-heading-3 text-accent">Final Score</span>
                <span className="text-heading-1 font-bold text-accent">
                  {score.total}
                </span>
              </div>
            </div>
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
          {success && !isCustomGame && (
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
          
          {isCustomGame && (
            <Button
              variant="outline"
              onClick={() => setShowShareDialog(true)}
              className="gap-2 w-full h-12"
            >
              <Share2 className="w-4 h-4" />
              Share Config
            </Button>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="frosted-modal max-w-md w-full space-y-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-2">Share Configuration</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShareDialog(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-3">
              <p className="text-small text-muted-foreground">
                Copy this code to share your custom game configuration with others:
              </p>
              
              <div className="flat-card flex items-center justify-between gap-3 p-4 bg-card/50">
                <code className="text-tiny font-mono break-all flex-1 text-foreground">
                  {shareCode}
                </code>
                <Button
                  size="sm"
                  variant={copiedCode ? "default" : "outline"}
                  onClick={handleCopyCode}
                  className="shrink-0"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              
              {config && (
                <div className="flat-card bg-primary/5 p-4 space-y-2">
                  <p className="text-tiny font-semibold">Configuration Summary:</p>
                  <div className="text-tiny text-muted-foreground space-y-1">
                    <p>• Pings: {config.pingsMode === 'unlimited' ? '∞' : config.pingsCount}</p>
                    <p>• Timer: {config.timerEnabled ? 'Enabled' : 'Disabled'}</p>
                    <p>• Arena: {config.arenaSize}</p>
                    <p>• Target: {config.targetSize}px</p>
                    {config.multiRound && <p>• Rounds: {config.numberOfRounds}</p>}
                    {config.winCondition && config.winCondition.type !== 'none' && (
                      <p>• Challenge: {config.winCondition.type} ({config.winCondition.proximityThreshold}%)</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowShareDialog(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBreakdownItem({ 
  label, 
  value, 
  isPositive, 
  detail,
  highlight 
}: { 
  label: string; 
  value: number; 
  isPositive: boolean; 
  detail?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex justify-between items-start gap-2 p-2 rounded-lg transition-colors ${
      highlight ? 'bg-accent/10 border border-accent/30' : 'hover:bg-white/5'
    }`}>
      <div className="flex-1">
        <div className="text-small font-medium">{label}</div>
        {detail && (
          <div className="text-xs text-muted-foreground">{detail}</div>
        )}
      </div>
      <div className={`font-mono font-bold text-base ${
        isPositive ? 'text-emerald-400' : 'text-rose-400'
      }`}>
        {isPositive ? '+' : '-'}{value}
      </div>
    </div>
  );
}
