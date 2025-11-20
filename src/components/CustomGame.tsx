import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomGameConfig, DEFAULT_CUSTOM_CONFIG, getArenaDimensions } from '@/lib/game/customConfig';
import { generateTargetPosition, getTargetCenter, Position, Target } from '@/lib/game/coords';
import { calculateProximity } from '@/lib/game/distance';
import { calculateCustomScore, checkWinCondition } from '@/lib/game/scoring';
import { audioEngine } from '@/lib/audio/engine';
import { PostRoundSummary } from './PostRoundSummary';
import { GameCanvas } from './GameCanvas';
import { GameStats } from './GameStats';
import { recordCustomGame } from '@/lib/game/customStats';
import { useGameTimer } from '@/hooks/useGameTimer';
import { usePingSystem } from '@/hooks/usePingSystem';
import { useGamePhase } from '@/hooks/useGamePhase';
import { useHintSystem } from '@/hooks/useHintSystem';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { saveGameSession, clearGameSession, loadGameSession } from '@/lib/game/customSession';
import { toast } from '@/hooks/use-toast';

export function CustomGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Check for resumed session first, then location.state config
  const resumedSession = location.state?.resumeSession ? loadGameSession() : null;
  const config = (location.state?.config as CustomGameConfig) || resumedSession?.config || DEFAULT_CUSTOM_CONFIG;
  
  const arenaSize = useMemo(() => {
    const configSize = getArenaDimensions(config.arenaSize);
    if (isMobile) {
      const vw = Math.min(window.innerWidth - 32, 600);
      const vh = Math.min(window.innerHeight - 400, vw * 0.75);
      return { width: vw, height: vh };
    }
    return configSize;
  }, [isMobile, config.arenaSize]);

  const [gameState, setGameState] = useState<'playing' | 'round-transition' | 'summary'>(
    resumedSession?.gameState || 'playing'
  );
  const [currentRound, setCurrentRound] = useState(resumedSession?.currentRound || 1);
  const [roundScores, setRoundScores] = useState<any[]>(resumedSession?.roundScores || []);
  const [target, setTarget] = useState(() => 
    resumedSession?.target || generateTargetPosition(arenaSize, config.targetSize)
  );
  const [scoreResult, setScoreResult] = useState<any>(resumedSession ? null : null);
  const [targetMoveCount, setTargetMoveCount] = useState(resumedSession?.targetMoveCount || 0);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const { gamePhase, finalGuess, setFinalGuess, handlePlaceFinalGuess, handleRepositionGuess, handleGoBackToPinging, resetPhase } = useGamePhase();
  const { elapsedTime, finalTime, resetTimer } = useGameTimer({ 
    enabled: config.timerEnabled, 
    gamePhase 
  });
  
  const handleTargetMove = (newTarget: Target) => {
    setTarget(newTarget);
    setTargetMoveCount(prev => prev + 1);
  };

  const { pingHistory, pingsRemaining, pingsUsed, replaysRemaining, replaysUsed, handlePing, handleReplayPing, resetPings } = usePingSystem({
    initialPings: config.pingsMode === 'unlimited' ? Infinity : config.pingsCount,
    arenaSize,
    target,
    config,
    replaysAvailable: config.pingReplaysEnabled ? (config.replaysCount === 0 ? -1 : config.replaysCount) : 0,
    onTargetMove: handleTargetMove,
  });

  const { currentHint, showHint, setShowHint } = useHintSystem({
    enabled: config.hintsEnabled,
    pingsUsed,
    totalPings: config.pingsMode === 'unlimited' ? 10 : config.pingsCount,
    target,
    pingHistory,
  });

  useEffect(() => {
    audioEngine.initialize(arenaSize.width, arenaSize.height);
    audioEngine.setTheme(config.theme);
  }, [config.theme, arenaSize]);

  // Auto-save session on critical state changes
  useEffect(() => {
    if (gameState === 'summary') return; // Don't save completed games
    
    const sessionData = {
      config,
      gameState,
      currentRound,
      roundScores,
      target,
      pingHistory: pingHistory || [],
      finalGuess,
      pingsUsed,
      elapsedTime,
      finalTime,
      targetMoveCount,
      gamePhase,
      timestamp: Date.now(),
    };
    
    saveGameSession(sessionData);
  }, [config, gameState, currentRound, roundScores, target, pingHistory, finalGuess, pingsUsed, gamePhase, targetMoveCount]);

  // Show toast on successful resume
  useEffect(() => {
    if (resumedSession) {
      toast({
        title: 'Game Resumed',
        description: `Continuing from Round ${resumedSession.currentRound}`,
      });
    }
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState === 'summary') return;
    if (gameState === 'round-transition') return; // Still block clicks during transition
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPos: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (gamePhase === 'pinging') {
      handlePing(clickPos);
    } else if (gamePhase === 'placing') {
      setFinalGuess(clickPos);
    }
  };

  const handleSubmitGuess = () => {
    if (!finalGuess) return;
    
    const targetCenter = getTargetCenter(target);
    const proximity = calculateProximity(finalGuess, targetCenter, Math.sqrt(arenaSize.width ** 2 + arenaSize.height ** 2) * 0.7);
    const totalPings = config.pingsMode === 'unlimited' ? 10 : config.pingsCount;
    const score = calculateCustomScore(
      proximity, 
      pingsUsed, 
      totalPings, 
      finalTime ?? elapsedTime, 
      config.timerEnabled
    );
    
    // Check win condition
    const hasWon = config.winCondition && config.winCondition.type !== 'none'
      ? checkWinCondition(proximity, pingsUsed, finalTime ?? elapsedTime, score.total, config.winCondition as any)
      : true;
    
    setScoreResult({ ...score, hasWon, proximity });

    // Multi-round handling (unlimited = -1, or check against target)
    if (config.numberOfRounds === -1 || currentRound < config.numberOfRounds) {
      setRoundScores(prev => [...prev, score]);
      setGameState('round-transition');
      setShowSummaryModal(true); // Auto-show modal like Classic mode
    } else {
      // Final round or single round
      setRoundScores(prev => [...prev, score]);
      setGameState('summary');
      
      // Record custom game stats
      recordCustomGame(
        config,
        score.total,
        proximity,
        pingsUsed,
        finalTime ?? elapsedTime,
        hasWon
      );
    }
  };

  const handleNextRound = () => {
    // Record stats for the completed round
    if (scoreResult) {
      recordCustomGame(
        config,
        scoreResult.total,
        scoreResult.proximity,
        pingsUsed,
        finalTime ?? elapsedTime,
        scoreResult.hasWon
      );
    }

    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    setTarget(generateTargetPosition(arenaSize, config.targetSize));
    resetPings();
    resetPhase();
    resetTimer();
    setTargetMoveCount(0);
    setGameState('playing');
    setScoreResult(null);
    setShowSummaryModal(false);
  };

  const handleRetry = () => {
    clearGameSession();
    setCurrentRound(1);
    setRoundScores([]);
    setTarget(generateTargetPosition(arenaSize, config.targetSize));
    resetPings();
    resetPhase();
    resetTimer();
    setTargetMoveCount(0);
    setGameState('playing');
    setScoreResult(null);
  };

  const handleQuitGame = () => {
    clearGameSession();
    navigate('/custom-mode');
  };

  if (gameState === 'summary' && scoreResult) {
    // Clear session when game is complete
    clearGameSession();
    
    const totalScore = roundScores.reduce((sum, s) => sum + s.total, 0);
    
    return (
      <PostRoundSummary
        score={{ ...scoreResult, total: totalScore }}
        proximity={scoreResult.proximity}
        pingsUsed={pingsUsed}
        totalPings={config.pingsMode === 'unlimited' ? 10 : config.pingsCount}
        timeElapsed={finalTime ?? elapsedTime}
        onNext={handleRetry}
        onRetry={handleRetry}
        onMenu={() => navigate('/')}
        isCustomGame={true}
        winCondition={config.winCondition}
        passedCondition={scoreResult.hasWon}
        config={config}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border p-4">
        <div className={cn("mx-auto flex items-center justify-between", isMobile ? "max-w-full" : "max-w-6xl")}>
          <Button variant="ghost" size="sm" onClick={handleQuitGame} className="hover-lift">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {!isMobile && 'Menu'}
          </Button>
          <div className="text-center flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <p className={cn("font-display font-semibold", isMobile ? "text-lg" : "text-heading-3")}>
              Custom Game
              {config.numberOfRounds > 1 && ` (${currentRound}/${config.numberOfRounds})`}
              {config.numberOfRounds === -1 && ` (Round ${currentRound})`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="hover-lift">
            <SettingsIcon className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        <div className={cn("space-y-4 md:space-y-6 w-full", isMobile ? "max-w-full" : "max-w-4xl")}>
          <GameStats
            pingsRemaining={pingsRemaining}
            pingsUsed={pingsUsed}
            elapsedTime={elapsedTime}
            finalTime={finalTime}
            timerEnabled={config.timerEnabled}
            pingsMode={config.pingsMode}
          />

          {showHint && currentHint && config.hintsEnabled && (
            <div className="flat-card bg-accent/20 border-accent/50 backdrop-blur-sm animate-fade-in">
              <p className="text-small text-accent-foreground">{currentHint.message}</p>
            </div>
          )}

          <GameCanvas
            arenaSize={arenaSize}
            target={target}
            pingHistory={pingHistory}
            finalGuess={finalGuess}
            gamePhase={gamePhase}
            gameState={gameState}
            showHint={showHint}
            currentHint={currentHint}
            targetMoveCount={targetMoveCount}
            showPingLocations={config.showPingLocations}
            onCanvasClick={handleCanvasClick}
            onPingReplay={config.pingReplaysEnabled ? handleReplayPing : undefined}
            replaysRemaining={replaysRemaining}
            replaysUsed={replaysUsed}
            canvasRef={canvasRef}
            showTargetMovementIndicator={config.movementMode === 'after-pings'}
          />

          <div className="flex justify-center gap-3">
            {gamePhase === 'pinging' && (
              <Button 
                size={isMobile ? "lg" : "default"} 
                onClick={handlePlaceFinalGuess} 
                disabled={pingsUsed === 0}
                className={cn("hover-lift", isMobile && "min-h-[48px] px-8")}
              >
                Place Final Guess
              </Button>
            )}
            {gamePhase === 'placing' && (
              <div className="text-center space-y-3">
                <p className="text-small text-muted-foreground">Click on the canvas to place your guess</p>
                <Button 
                  variant="outline" 
                  size={isMobile ? "lg" : "default"} 
                  onClick={handleGoBackToPinging}
                  className={isMobile ? "min-h-[48px]" : ""}
                >
                  Back to Pinging
                </Button>
              </div>
            )}
            {gamePhase === 'confirming' && finalGuess && (
              <>
                <Button 
                  variant="outline" 
                  size={isMobile ? "lg" : "default"} 
                  onClick={handleRepositionGuess}
                  className={isMobile ? "min-h-[48px]" : ""}
                >
                  Reposition
                </Button>
                <Button 
                  size={isMobile ? "lg" : "default"} 
                  onClick={handleSubmitGuess} 
                  className={cn("hover-lift", isMobile && "min-h-[48px]")}
                >
                  Confirm & Submit
                </Button>
              </>
            )}
          </div>

          {/* View Summary Button Overlay (for round transition) */}
          {gameState === 'round-transition' && scoreResult && !showSummaryModal && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => setShowSummaryModal(true)}
                className="hover-lift animate-bounce-subtle shadow-glow"
              >
                View Summary
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Post Round Summary Modal (for round transition) */}
      {gameState === 'round-transition' && scoreResult && showSummaryModal && (
        <PostRoundSummary
          score={scoreResult}
          proximity={scoreResult.proximity}
          pingsUsed={pingsUsed}
          totalPings={config.pingsMode === 'unlimited' ? 10 : config.pingsCount}
          timeElapsed={finalTime ?? elapsedTime}
          onNext={handleNextRound}
          onRetry={handleNextRound}
          onMenu={() => navigate('/')}
          onClose={() => setShowSummaryModal(false)}
          isCustomGame={true}
          showNextButton={true}
          nextButtonLabel={`Continue to Round ${currentRound + 1}`}
        />
      )}
    </div>
  );
}
