import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CustomGameConfig, DEFAULT_CUSTOM_CONFIG, getArenaDimensions } from '@/lib/game/customConfig';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Radio, Lightbulb } from 'lucide-react';
import { generateTargetPosition, getTargetCenter, Position } from '@/lib/game/coords';
import { calculateProximity } from '@/lib/game/distance';
import { calculateCustomScore, checkWinCondition, getRankFlavor } from '@/lib/game/scoring';
import { generateHint, shouldShowHint, Hint } from '@/lib/game/hints';
import { audioEngine } from '@/lib/audio/engine';
import { PostRoundSummary } from './PostRoundSummary';
import { recordCustomGame } from '@/lib/game/customStats';

export function CustomGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const config = (location.state?.config as CustomGameConfig) || DEFAULT_CUSTOM_CONFIG;
  const arenaSize = getArenaDimensions(config.arenaSize);

  const [gameState, setGameState] = useState<'playing' | 'round-transition' | 'summary'>('playing');
  const [currentRound, setCurrentRound] = useState(1);
  const [roundScores, setRoundScores] = useState<any[]>([]);
  const [target, setTarget] = useState(() => 
    generateTargetPosition(arenaSize, config.targetSize)
  );
  const [pingsRemaining, setPingsRemaining] = useState(
    config.pingsMode === 'unlimited' ? Infinity : config.pingsCount
  );
  const [pingsUsed, setPingsUsed] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [pingHistory, setPingHistory] = useState<Position[]>([]);
  const [gamePhase, setGamePhase] = useState<'pinging' | 'placing' | 'confirming'>('pinging');
  const [finalGuess, setFinalGuess] = useState<Position | null>(null);
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [targetMoveCount, setTargetMoveCount] = useState(0);
  const [currentHint, setCurrentHint] = useState<Hint | null>(null);

  useEffect(() => {
    audioEngine.initialize();
    audioEngine.setTheme(config.theme);
  }, [config.theme]);

  useEffect(() => {
    // Only run timer if enabled and not finished
    if (!config.timerEnabled || finalTime !== null) return;
    
    const interval = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [config.timerEnabled, startTime, finalTime]);

  // Freeze timer when final guess is placed
  useEffect(() => {
    if (gamePhase === 'confirming' && finalTime === null && config.timerEnabled) {
      setFinalTime(elapsedTime);
    }
  }, [gamePhase, finalTime, elapsedTime, config.timerEnabled]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState === 'summary') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickPos: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (gamePhase === 'pinging') {
      // Check ping limit (unless unlimited)
      if (config.pingsMode === 'limited' && pingsRemaining <= 0) return;
      
      // Add to ping history
      setPingHistory(prev => [...prev, clickPos]);

      // Play ping sound
      const targetCenter = getTargetCenter(target);
      audioEngine.playPing(clickPos, targetCenter, Math.max(arenaSize.width, arenaSize.height));

      // Decrement pings (if limited mode)
      if (config.pingsMode === 'limited') {
        setPingsRemaining(prev => prev - 1);
      }
      setPingsUsed(prev => prev + 1);
      
      // Generate hint if enabled and threshold met
      if (config.hintsEnabled) {
        const totalPings = config.pingsMode === 'unlimited' ? 10 : config.pingsCount;
        if (shouldShowHint(pingsUsed + 1, totalPings)) {
          const hint = generateHint(clickPos, target, arenaSize);
          setCurrentHint(hint);
          // Auto-hide after 5 seconds
          setTimeout(() => setCurrentHint(null), 5000);
        }
      }
      
      // Handle target movement
      if (config.movementMode === 'after-pings') {
        const newMoveCount = targetMoveCount + 1;
        setTargetMoveCount(newMoveCount);
        
        if (newMoveCount >= config.movementTrigger) {
          // Target moves!
          const newTarget = generateTargetPosition(arenaSize, config.targetSize);
          setTarget(newTarget);
          setTargetMoveCount(0);
          
          // Visual/audio feedback for target movement
          audioEngine.playFailure(); // Use failure sound as "warning"
          // Clear hint when target moves
          setCurrentHint(null);
        }
      }
    } else if (gamePhase === 'placing') {
      setFinalGuess(clickPos);
      setGamePhase('confirming');
    }
  };

  const handlePlaceFinalGuess = () => {
    setGamePhase('placing');
  };

  const handleGoBackToPinging = () => {
    setFinalGuess(null);
    setGamePhase('pinging');
    // Unfreeze timer if enabled
    if (config.timerEnabled) {
      setFinalTime(null);
    }
  };

  const handleRepositionGuess = () => {
    setFinalGuess(null);
    setGamePhase('placing');
  };

  const handleSubmitGuess = () => {
    if (!finalGuess) return;

    const targetCenter = getTargetCenter(target);
    const proximity = calculateProximity(
      finalGuess, 
      targetCenter, 
      Math.max(arenaSize.width, arenaSize.height)
    );
    
    const timeToScore = config.timerEnabled ? (finalTime ?? elapsedTime) : 0;
    
    // Calculate score with custom adjustments
    const score = calculateCustomScore(
      proximity,
      pingsUsed,
      config.pingsMode === 'unlimited' ? Infinity : config.pingsCount,
      timeToScore,
      config.timerEnabled
    );
    
    // Check win condition
    const passedCondition = checkWinCondition(proximity, config.winCondition);
    
    const scoreWithFlavor = {
      ...score,
      flavorText: getRankFlavor(score.rank),
      passedCondition,
    };
    
    const roundResult = {
      ...scoreWithFlavor,
      pingsUsed,
      totalPings: config.pingsMode === 'unlimited' ? '∞' : config.pingsCount,
      timeElapsed: timeToScore,
      proximity,
      round: currentRound,
    };
    
    // Handle multi-round mode
    if (config.multiRound && currentRound < config.numberOfRounds) {
      // Save round score and transition to next round
      setRoundScores(prev => [...prev, roundResult]);
      setScoreResult(roundResult);
      
      // Record stats
      recordCustomGame(
        config,
        roundResult.total,
        roundResult.proximity,
        roundResult.pingsUsed,
        roundResult.timeElapsed,
        roundResult.passedCondition
      );
      
      setGameState('round-transition');
    } else {
      // Final round or single round mode
      const allScores = config.multiRound ? [...roundScores, roundResult] : [roundResult];
      setRoundScores(allScores);
      setScoreResult(roundResult);
      
      // Record stats
      recordCustomGame(
        config,
        roundResult.total,
        roundResult.proximity,
        roundResult.pingsUsed,
        roundResult.timeElapsed,
        roundResult.passedCondition
      );
      
      // Play sound based on win condition
      if (passedCondition) {
        audioEngine.playSuccess();
      } else {
        audioEngine.playFailure();
      }
      
      setGameState('summary');
    }
  };

  const handleNextRound = () => {
    // Reset for next round
    setCurrentRound(prev => prev + 1);
    setTarget(generateTargetPosition(arenaSize, config.targetSize));
    setPingsRemaining(config.pingsMode === 'unlimited' ? Infinity : config.pingsCount);
    setPingsUsed(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    setFinalTime(null);
    setPingHistory([]);
    setGamePhase('pinging');
    setFinalGuess(null);
    setTargetMoveCount(0);
    setCurrentHint(null);
    setGameState('playing');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  const getTimeColor = () => {
    if (!config.timerEnabled) return 'text-foreground';
    const time = finalTime ?? elapsedTime;
    if (time < 15) return 'text-accent';
    if (time < 30) return 'text-foreground';
    return 'text-destructive';
  };

  if (gameState === 'summary' && scoreResult) {
    const allScores = config.multiRound ? roundScores : [];
    const cumulativeScore = allScores.length > 0 ? allScores.reduce((sum, r) => sum + r.total, 0) : scoreResult.total;
    const avgScore = allScores.length > 0 ? Math.round(cumulativeScore / allScores.length) : scoreResult.total;
    
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full space-y-8 animate-fade-in">
          {config.multiRound && allScores.length > 1 && (
            <div className="flat-card space-y-4">
              <h2 className="text-heading-2 text-center">Multi-Round Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="flat-card bg-card/50 text-center">
                  <p className="text-tiny text-muted-foreground mb-1">Total Score</p>
                  <p className="text-heading-1">{cumulativeScore}</p>
                </div>
                <div className="flat-card bg-card/50 text-center">
                  <p className="text-tiny text-muted-foreground mb-1">Average</p>
                  <p className="text-heading-1">{avgScore}</p>
                </div>
                <div className="flat-card bg-card/50 text-center">
                  <p className="text-tiny text-muted-foreground mb-1">Rounds</p>
                  <p className="text-heading-1">{allScores.length}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-tiny text-muted-foreground text-center">Individual Rounds</p>
                <div className="grid grid-cols-5 gap-2">
                  {allScores.map((r, i) => (
                    <div key={i} className="flat-card bg-card/30 text-center p-3">
                      <p className="text-tiny text-muted-foreground">Round {i + 1}</p>
                      <p className="text-base font-mono font-semibold">{r.total}</p>
                      <p className="text-tiny text-accent">{r.rank.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <PostRoundSummary
            score={scoreResult}
            proximity={scoreResult.proximity}
            pingsUsed={scoreResult.pingsUsed}
            totalPings={scoreResult.totalPings === '∞' ? Infinity : scoreResult.totalPings}
            timeElapsed={scoreResult.timeElapsed}
            onNext={() => navigate('/custom')}
            onRetry={() => {
              setGameState('playing');
              setCurrentRound(1);
              setRoundScores([]);
              setTarget(generateTargetPosition(arenaSize, config.targetSize));
              setPingsRemaining(config.pingsMode === 'unlimited' ? Infinity : config.pingsCount);
              setPingsUsed(0);
              setStartTime(Date.now());
              setElapsedTime(0);
              setFinalTime(null);
              setPingHistory([]);
              setGamePhase('pinging');
              setFinalGuess(null);
              setScoreResult(null);
              setTargetMoveCount(0);
              setCurrentHint(null);
            }}
            onMenu={() => navigate('/')}
          />
        </div>
      </div>
    );
  }

  // Round Transition Screen
  if (gameState === 'round-transition' && scoreResult) {
    const cumulativeScore = [...roundScores, scoreResult].reduce((sum, r) => sum + r.total, 0);
    const avgScore = Math.round(cumulativeScore / (roundScores.length + 1));
    
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8 animate-fade-in">
          <div className="flat-card text-center space-y-6">
            <div>
              <h1 className="text-heading-1 mb-2">Round {currentRound} Complete!</h1>
              <p className="text-muted-foreground">
                {config.numberOfRounds - currentRound} round{config.numberOfRounds - currentRound > 1 ? 's' : ''} remaining
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flat-card bg-card/50">
                <p className="text-tiny text-muted-foreground mb-1">This Round</p>
                <p className="text-heading-1">{scoreResult.total}</p>
                <p className="text-small text-accent">{scoreResult.rank.name}</p>
              </div>
              <div className="flat-card bg-card/50">
                <p className="text-tiny text-muted-foreground mb-1">Average Score</p>
                <p className="text-heading-1">{avgScore}</p>
                <p className="text-small text-muted-foreground">Across {currentRound} rounds</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-tiny text-muted-foreground">Round Scores</p>
              <div className="flex gap-2 justify-center">
                {[...roundScores, scoreResult].map((r, i) => (
                  <div key={i} className="flat-card bg-card/30 px-3 py-2 text-center">
                    <p className="text-tiny text-muted-foreground">R{i + 1}</p>
                    <p className="text-small font-mono">{r.total}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleNextRound}
              size="lg"
              className="w-full h-14 text-base hover-lift"
            >
              Start Round {currentRound + 1}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/custom')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-heading-1">Custom Round</h1>
              <p className="text-small text-muted-foreground">
                {config.arenaSize.charAt(0).toUpperCase() + config.arenaSize.slice(1)} Arena • {config.targetSize}px Target
                {config.multiRound && ` • Round ${currentRound}/${config.numberOfRounds}`}
              </p>
            </div>
          </div>
        </div>

        {/* Game Stats */}
        <div className="flat-card flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Pings Display */}
            <div>
              <p className="text-tiny text-muted-foreground">Pings Left</p>
              <p className="text-heading-2 font-mono">
                {config.pingsMode === 'unlimited' ? '∞' : pingsRemaining}
              </p>
              {config.pingsMode === 'limited' && pingsRemaining === config.pingsCount && (
                <p className="text-tiny text-accent mt-1">
                  Max bonus: +{config.pingsCount * 50}
                </p>
              )}
            </div>
            
            {/* Timer Display (conditional) */}
            {config.timerEnabled && (
              <div>
                <p className="text-tiny text-muted-foreground">Time</p>
                <p className={`text-heading-2 font-mono ${getTimeColor()}`}>
                  {formatTime(finalTime ?? elapsedTime)}
                </p>
              </div>
            )}
            
            {/* Pings Used */}
            <div>
              <p className="text-tiny text-muted-foreground">Pings Used</p>
              <p className="text-heading-2 font-mono">{pingsUsed}</p>
            </div>

            {/* Target Size */}
            <div>
              <p className="text-tiny text-muted-foreground">Target Size</p>
              <p className="text-heading-2 font-mono">{config.targetSize}px</p>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex justify-center">
          <div
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="relative bg-echo-canvas rounded-xl shadow-echo cursor-crosshair overflow-hidden border border-border"
            style={{
              width: `${arenaSize.width}px`,
              height: `${arenaSize.height}px`,
            }}
          >
            {/* Instruction Text */}
            {gamePhase === 'pinging' && pingHistory.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-2 opacity-50">
                  <Radio className="w-12 h-12 mx-auto animate-pulse" />
                  <p className="text-small">Click to ping and locate the target</p>
                </div>
              </div>
            )}

            {gamePhase === 'placing' && !finalGuess && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-2 opacity-50">
                  <p className="text-small">Click to place your final guess</p>
                </div>
              </div>
            )}

            {/* Ping history */}
            {pingHistory.map((ping, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-primary/30 rounded-full"
                style={{
                  left: `${ping.x}px`,
                  top: `${ping.y}px`,
                  transform: 'translate(-50%, -50%)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            ))}
            
            {/* Final guess */}
            {finalGuess && (
              <div
                className="absolute w-8 h-8 border-4 border-accent rounded-full"
                style={{
                  left: `${finalGuess.x}px`,
                  top: `${finalGuess.y}px`,
                  transform: 'translate(-50%, -50%)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            )}

            {/* Target movement indicator */}
            {config.movementMode === 'after-pings' && targetMoveCount > 0 && (
              <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border">
                <p className="text-tiny text-muted-foreground">
                  Target moves in {config.movementTrigger - targetMoveCount} pings
                </p>
              </div>
            )}

            {/* Hint Display */}
            {currentHint && config.hintsEnabled && (
              <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-4 py-3 rounded-xl border border-primary/30 shadow-lg animate-fade-in max-w-xs">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-small font-semibold text-primary mb-1">Hint</p>
                    <p className="text-tiny text-foreground">{currentHint.message}</p>
                  </div>
                </div>
                {config.hintLevel === 'detailed' && currentHint.visualCue && currentHint.visualCue.type === 'arrow' && (
                  <div className="mt-2 flex justify-center">
                    <div 
                      className="w-8 h-8 border-2 border-primary rounded-full flex items-center justify-center"
                      style={{
                        transform: `rotate(${currentHint.visualCue.data.angle}rad)`,
                      }}
                    >
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-8 border-b-primary transform -rotate-90" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          {gamePhase === 'pinging' && (
            <Button
              onClick={handlePlaceFinalGuess}
              size="lg"
              className="min-w-[200px]"
            >
              Place Final Guess
            </Button>
          )}

          {gamePhase === 'placing' && !finalGuess && (
            <Button
              variant="outline"
              onClick={handleGoBackToPinging}
            >
              Back to Pinging
            </Button>
          )}

          {gamePhase === 'confirming' && finalGuess && (
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleRepositionGuess}
              >
                Reposition
              </Button>
              <Button
                onClick={handleSubmitGuess}
                size="lg"
                className="min-w-[200px]"
              >
                Submit Guess
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
