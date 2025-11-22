import { Trophy, Clock, Target, Zap, Lightbulb, Share2, Copy, Check, X, Volume2, PartyPopper, HeartCrack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/InfoTooltip';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getNextRankInfo, getPointsToNextRank, getProgressToNextRank, generateStrategicTips, getRankColor, RANK_THRESHOLDS, canProgressToNextLevel } from '@/lib/game/scoring';
import { CustomGameConfig, encodeConfigToShareCode } from '@/lib/game/customConfig';
import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useCountUp } from '@/hooks/useCountUp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

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
  difficulty?: 'normal' | 'challenge';
  winCondition?: CustomGameConfig['winCondition'];
  passedCondition?: boolean;
  config?: CustomGameConfig;
  replaysUsed?: number;
  replaysAvailable?: number;
  showNextButton?: boolean;
  nextButtonLabel?: string;
  currentRound?: number;
  totalRounds?: number;
  roundScores?: Array<{ total: number; proximity: number; pingsUsed: number; hasWon: boolean }>;
  gameState?: 'playing' | 'round-transition' | 'summary';
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
  isCustomGame = false,
  difficulty = 'normal',
  winCondition,
  passedCondition,
  config,
  replaysUsed = 0,
  replaysAvailable,
  showNextButton,
  nextButtonLabel,
  currentRound,
  totalRounds,
  roundScores = [],
  gameState = 'summary',
}: PostRoundSummaryProps) {
  // Detect boss level (Level 10, 20, 30, etc.) - only for classic mode
  const isBossLevel = !isCustomGame && (typeof score.level === 'number' ? score.level % 10 === 0 : false);
  const success = isCustomGame ? (passedCondition ?? false) : canProgressToNextLevel(score.rank, isBossLevel);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const shareCode = isCustomGame && config ? encodeConfigToShareCode(config) : '';

  // Confetti for SS rank
  useEffect(() => {
    if (!isCustomGame && score.rank === 'SS') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [score.rank, isCustomGame]);

  // Animated score counting
  const animatedTotal = useCountUp(score.total, 1500);
  const animatedProximityBonus = useCountUp(score.components.proximityBonus || 0, 800);
  const animatedTimeScore = useCountUp(Math.abs(score.components.timeScore || 0), 800);
  const animatedPingEfficiency = useCountUp(score.components.pingEfficiencyBonus || 0, 800);

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

  // Keyboard shortcuts for quick navigation
  useKeyboardShortcuts({
    'n': () => {
      if (success || (isCustomGame && showNextButton)) {
        onNext();
      }
    },
    'r': onRetry,
    ' ': () => { // Space key
      if (success || (isCustomGame && showNextButton)) {
        onNext();
      }
    },
  }, true);

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

        {/* Round Progress & Cumulative Stats (for multi-round mid-game) */}
        {isCustomGame && currentRound && gameState === 'round-transition' && roundScores.length > 0 && (
          <div className="flat-card bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 space-y-3">
            <div className="text-center">
              <p className="text-heading-2 text-primary">
                {totalRounds === -1 
                  ? `Round ${currentRound} • Cozy Mode` 
                  : `Round ${currentRound} of ${totalRounds}`}
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center space-y-1">
                <p className="text-tiny text-muted-foreground">Total Score</p>
                <p className="text-heading-3 font-mono text-primary">
                  {roundScores.reduce((sum, r) => sum + r.total, 0)}
                </p>
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-tiny text-muted-foreground">Avg Proximity</p>
                <p className="text-heading-3 font-mono text-primary">
                  {(roundScores.reduce((sum, r) => sum + r.proximity, 0) / roundScores.length).toFixed(1)}%
                </p>
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-tiny text-muted-foreground">Best Round</p>
                <p className="text-heading-3 font-mono text-primary">
                  {Math.max(...roundScores.map(r => r.total))}
                </p>
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-tiny text-muted-foreground">Rounds Won</p>
                <p className="text-heading-3 font-mono text-primary">
                  {roundScores.filter(r => r.hasWon).length}/{roundScores.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Session Stats (for final summary with multiple rounds) */}
        {isCustomGame && gameState === 'summary' && roundScores.length > 1 && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-heading-1 text-primary animate-pulse-glow">🎉 Session Complete!</h2>
              <p className="text-muted-foreground">
                Completed {roundScores.length} round{roundScores.length > 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flat-card bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {/* Row 1 - Score Performance */}
                <div className="text-center space-y-1 p-3 rounded-lg bg-background/30">
                  <p className="text-tiny text-muted-foreground uppercase tracking-wide">Total Score</p>
                  <p className="text-heading-2 font-mono text-primary">
                    {roundScores.reduce((sum, r) => sum + r.total, 0)}
                  </p>
                </div>
                
                <div className="text-center space-y-1 p-3 rounded-lg bg-background/30">
                  <p className="text-tiny text-muted-foreground uppercase tracking-wide">Avg Score</p>
                  <p className="text-heading-2 font-mono text-primary">
                    {Math.round(roundScores.reduce((sum, r) => sum + r.total, 0) / roundScores.length)}
                  </p>
                </div>
                
                <div className="text-center space-y-1 p-3 rounded-lg bg-background/30">
                  <p className="text-tiny text-muted-foreground uppercase tracking-wide">Best Round</p>
                  <p className="text-heading-2 font-mono text-primary">
                    {Math.max(...roundScores.map(r => r.total))}
                  </p>
                </div>
                
                {/* Row 2 - Accuracy */}
                <div className="text-center space-y-1 p-3 rounded-lg bg-background/30">
                  <p className="text-tiny text-muted-foreground uppercase tracking-wide">Avg Proximity</p>
                  <p className="text-heading-2 font-mono text-accent">
                    {(roundScores.reduce((sum, r) => sum + r.proximity, 0) / roundScores.length).toFixed(1)}%
                  </p>
                </div>
                
                <div className="text-center space-y-1 p-3 rounded-lg bg-background/30">
                  <p className="text-tiny text-muted-foreground uppercase tracking-wide">Best Prox</p>
                  <p className="text-heading-2 font-mono text-accent">
                    {Math.max(...roundScores.map(r => r.proximity)).toFixed(1)}%
                  </p>
                </div>
                
                <div className="text-center space-y-1 p-3 rounded-lg bg-background/30">
                  <p className="text-tiny text-muted-foreground uppercase tracking-wide">Worst Prox</p>
                  <p className="text-heading-2 font-mono text-accent">
                    {Math.min(...roundScores.map(r => r.proximity)).toFixed(1)}%
                  </p>
                </div>
                
                {/* Row 3 - Efficiency */}
                <div className="text-center space-y-1 p-3 rounded-lg bg-background/30">
                  <p className="text-tiny text-muted-foreground uppercase tracking-wide">Total Pings</p>
                  <p className="text-heading-2 font-mono text-echo-success">
                    {roundScores.reduce((sum, r) => sum + r.pingsUsed, 0)}
                  </p>
                </div>
                
                <div className="text-center space-y-1 p-3 rounded-lg bg-background/30">
                  <p className="text-tiny text-muted-foreground uppercase tracking-wide">Avg Pings</p>
                  <p className="text-heading-2 font-mono text-echo-success">
                    {(roundScores.reduce((sum, r) => sum + r.pingsUsed, 0) / roundScores.length).toFixed(1)}
                  </p>
                </div>
                
                <div className="text-center space-y-1 p-3 rounded-lg bg-background/30">
                  <p className="text-tiny text-muted-foreground uppercase tracking-wide">Win Rate</p>
                  <p className="text-heading-2 font-mono text-echo-success">
                    {winCondition && winCondition.type !== 'none'
                      ? `${Math.round((roundScores.filter(r => r.hasWon).length / roundScores.length) * 100)}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Additional Callouts */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                {roundScores.some(r => r.proximity === 100) && (
                  <div className="text-center">
                    <p className="text-small text-echo-success">
                      🏆 {roundScores.filter(r => r.proximity === 100).length} Perfect Round{roundScores.filter(r => r.proximity === 100).length > 1 ? 's' : ''} (100%)
                    </p>
                  </div>
                )}
                
                {(() => {
                  const scores = roundScores.map(r => r.total);
                  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
                  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
                  const stdDev = Math.sqrt(variance);
                  const consistency = stdDev < 100 ? 'Excellent' : stdDev < 200 ? 'Good' : 'Varied';
                  
                  return (
                    <div className="text-center">
                      <p className="text-small text-muted-foreground">
                        ⚡ Consistency: <span className="text-foreground font-semibold">{consistency}</span>
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Rank - Only show for Classic mode */}
        {!isCustomGame && (
          <div className="text-center space-y-2">
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div 
                    className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-3xl font-display font-bold border-2 cursor-help ${
                      getRankColor(score.rank).bg
                    } ${
                      getRankColor(score.rank).text
                    } ${
                      getRankColor(score.rank).border
                    }`}
                  >
                    {score.rank}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold mb-2">Rank Thresholds</p>
                    {RANK_THRESHOLDS.map(({ rank, threshold }) => (
                      <div 
                        key={rank}
                        className={`flex justify-between text-xs ${
                          rank === score.rank ? 'font-bold text-accent' : 'text-muted-foreground'
                        }`}
                      >
                        <span>{rank}:</span>
                        <span>{threshold}+ points</span>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-heading-2">{score.flavorText}</p>
            <p className="text-muted-foreground">
              {success 
                ? (isBossLevel ? `${score.rank} Rank - Boss Defeated!` : `${score.rank} Rank - Advancing to Next Level!`)
                : (isBossLevel 
                    ? `${score.rank} Rank - Need A Rank or better to defeat boss` 
                    : `${score.rank} Rank - Need B Rank or better to advance`)
              }
            </p>
          </div>
        )}

        {/* Score */}
        <div className="text-center">
          <p className="text-tiny text-muted-foreground uppercase tracking-wider mb-2">
            Total Score
          </p>
          <p className="text-5xl text-primary font-mono">{animatedTotal}</p>
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
              
              {score.components.proximityBonus > 0 && (
                <ScoreBreakdownItem 
                  label="Accuracy Score"
                  value={animatedProximityBonus}
                  isPositive={true}
                  detail={`${proximity.toFixed(1)}% proximity × 5`}
                  tooltip="Core scoring component based on proximity. Each 1% of accuracy awards 5 points, up to +500 for perfect accuracy."
                />
              )}
              
              {score.components.pingEfficiencyBonus > 0 && (
                <ScoreBreakdownItem 
                  label="Ping Efficiency"
                  value={animatedPingEfficiency}
                  isPositive={true}
                  detail={`${totalPings - pingsUsed} unused pings`}
                  tooltip="Bonus for conserving pings. Each unused ping adds to your score, up to +200 points maximum."
                />
              )}
              
              
              {score.components.timeScore !== 0 && (isCustomGame || difficulty === 'challenge') && (
              <ScoreBreakdownItem 
                label="Time Score"
                value={animatedTimeScore}
                isPositive={score.components.timeScore > 0}
                  detail={`Completed in ${timeElapsed.toFixed(1)}s`}
                  tooltip="Core scoring component based on completion speed. Fast times (<15s) add points, slow times (>45s) subtract points. Only active in Challenge mode."
                />
              )}
              
              {score.components.perfectTargetBonus > 0 && (
                <ScoreBreakdownItem 
                  label="Perfect Hit"
                  value={score.components.perfectTargetBonus}
                  isPositive={true}
                  highlight={true}
                  tooltip="Awarded for 100% accuracy - landing your guess exactly on the target center."
                />
              )}
              
            {score.components.chapterMechanicBonus > 0 && (
              <ScoreBreakdownItem 
                label="Chapter Mechanic Bonus"
                value={score.components.chapterMechanicBonus}
                isPositive={true}
                detail="Mastery of chapter's special mechanic"
                highlight={true}
                tooltip="Special bonus for mastering this chapter's unique mechanic. Requires specific performance thresholds."
              />
            )}

            {score.components.replayBonus > 0 && (
              <ScoreBreakdownItem 
                label="Replay Conservation"
                value={score.components.replayBonus}
                isPositive={true}
                detail={`${(replaysAvailable || 0) - replaysUsed} replays unused`}
                highlight={true}
                tooltip="Bonus for conserving ping replays. Each unused replay adds points."
              />
            )}

            {score.components.hintPenalty < 0 && (
              <ScoreBreakdownItem 
                label="Hint Penalty"
                value={Math.abs(score.components.hintPenalty)}
                isPositive={false}
                tooltip="Penalty for using the hint system. Chapter 1 is penalty-free for learning."
              />
            )}
          </div>
            
            {/* Final Total */}
            <div className="pt-3 border-t-2 border-accent/30">
              <div className="flex justify-between items-center">
                <span className="text-heading-3 text-accent">Final Score</span>
                <span className="text-heading-1 font-bold text-accent">
                  {animatedTotal}
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
          {(() => {
            // For custom games, check enforceWinCondition
            if (isCustomGame && showNextButton) {
              const shouldShowNext = config?.enforceWinCondition 
                ? passedCondition 
                : true;
              
              return shouldShowNext ? (
                <Button 
                  onClick={onNext} 
                  size="lg"
                  className="w-full h-12"
                >
                  {nextButtonLabel || 'Next Round'}
                </Button>
              ) : null;
            }
            
            // For classic games
            if (success && !isCustomGame) {
              return (
                <Button 
                  onClick={onNext} 
                  size="lg"
                  className="w-full h-12"
                >
                  {nextButtonLabel || 'Next Level'}
                </Button>
              );
            }
            
            return null;
          })()}
          
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
                    {config.numberOfRounds > 1 && <p>• Rounds: {config.numberOfRounds}</p>}
                    {config.numberOfRounds === -1 && <p>• Mode: Cozy (Unlimited)</p>}
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
  highlight,
  tooltip 
}: { 
  label: string; 
  value: number; 
  isPositive: boolean; 
  detail?: string;
  highlight?: boolean;
  tooltip?: string;
}) {
  return (
    <div className={`flex justify-between items-start gap-2 p-2 rounded-lg transition-colors ${
      highlight ? 'bg-accent/10 border border-accent/30' : 'hover:bg-white/5'
    }`}>
      <div className="flex-1">
        <div className="text-small font-medium flex items-center gap-2">
          {label}
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
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
