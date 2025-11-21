import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, Settings as SettingsIcon, Check, Save, Users } from 'lucide-react';
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
import { getSaveSlot, updateSaveSlot, createSaveSlot, deleteSaveSlot, autoGenerateSlotName } from '@/lib/game/saveSlotManager';
import { CustomGameSession } from '@/lib/game/customSession';
import { sessionSyncManager } from '@/lib/game/customSessionSync';
import { toast } from '@/hooks/use-toast';

export function CustomGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // State for loading session
  const [loading, setLoading] = useState(true);
  const [resumedSession, setResumedSession] = useState<CustomGameSession | null>(null);
  const [config, setConfig] = useState<CustomGameConfig>(DEFAULT_CUSTOM_CONFIG);
  const [activeSlotId, setActiveSlotId] = useState<string>('');
  
  // Load or create session
  useEffect(() => {
    const loadSession = async () => {
      const slotId = location.state?.slotId;
      const createNew = location.state?.createNewSlot;
      
      if (createNew) {
        // Create new slot with provided name
        const slotName = location.state?.slotName || await autoGenerateSlotName();
        const gameConfig = location.state?.config || DEFAULT_CUSTOM_CONFIG;
        
        const newSlot = await createSaveSlot(slotName, {
          config: gameConfig,
          currentRound: 1,
          roundScores: [],
          target: generateTargetPosition(getArenaDimensions(gameConfig.arenaSize), gameConfig.targetSize),
          pingHistory: [],
          finalGuess: null,
          pingsUsed: 0,
          elapsedTime: 0,
          finalTime: null,
          targetMoveCount: 0,
          gamePhase: 'pinging',
          scoreResult: null,
          gameState: 'playing',
          timestamp: Date.now(),
        });
        
        setActiveSlotId(newSlot.id);
        setConfig(gameConfig);
      } else if (slotId) {
        // Load existing slot
        const slot = await getSaveSlot(slotId);
        if (slot) {
          setActiveSlotId(slotId);
          setResumedSession(slot.session);
          setConfig(slot.session.config);
        } else {
          toast({ 
            title: 'Save Not Found', 
            description: 'This saved game no longer exists.',
            variant: 'destructive' 
          });
          navigate('/custom');
          return;
        }
      } else {
        // No slot specified - shouldn't happen, go back
        navigate('/custom');
        return;
      }
      
      setLoading(false);
    };
    loadSession();
  }, [location.state, navigate]);

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
  const [roundScores, setRoundScores] = useState<Array<{ total: number; proximity: number; pingsUsed: number; hasWon: boolean }>>(
    resumedSession?.roundScores || []
  );
  const [target, setTarget] = useState(() => 
    resumedSession?.target || generateTargetPosition(arenaSize, config.targetSize)
  );
  const [scoreResult, setScoreResult] = useState<any>(resumedSession?.scoreResult || null);
  const [targetMoveCount, setTargetMoveCount] = useState(resumedSession?.targetMoveCount || 0);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [isMultiTab, setIsMultiTab] = useState(false);
  
  // Throttling for auto-save
  const lastSaveTimeRef = useRef<number>(0);
  const SAVE_THROTTLE_MS = 2000; // 2 seconds

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
    
    // Load saved audio preferences (global settings override config theme)
    const savedTheme = localStorage.getItem('echo_audio_theme');
    const savedVolume = localStorage.getItem('echo_volume');
    
    if (savedTheme) {
      audioEngine.setTheme(savedTheme);
    }
    if (savedVolume) {
      audioEngine.setVolume(parseInt(savedVolume) / 100);
    }
  }, [arenaSize]);

  // Multi-tab synchronization
  useEffect(() => {
    if (!sessionSyncManager.isAvailable()) {
      return;
    }

    // Subscribe to session updates from other tabs
    const unsubscribeSession = sessionSyncManager.subscribe((syncedSession) => {
      if (!syncedSession) {
        // Session cleared in another tab
        toast({
          title: 'Game Ended',
          description: 'Session ended in another tab',
          duration: 3000,
        });
        navigate('/custom');
        return;
      }
      
      // Session updated in another tab - sync state
      setGameState(syncedSession.gameState);
      setCurrentRound(syncedSession.currentRound);
      setRoundScores(syncedSession.roundScores);
      setTarget(syncedSession.target);
      setFinalGuess(syncedSession.finalGuess);
      setTargetMoveCount(syncedSession.targetMoveCount);
      setScoreResult(syncedSession.scoreResult);
      
      // Show brief sync notification
      toast({
        title: 'Game Synced',
        description: 'Updated from another tab',
        duration: 2000,
      });
    });
    
    // Subscribe to tab count updates
    const unsubscribeTabCount = sessionSyncManager.subscribeTabCount((count) => {
      setIsMultiTab(count > 1);
    });
    
    return () => {
      unsubscribeSession();
      unsubscribeTabCount();
    };
  }, [navigate]);

  // Throttled save function
  const saveGameThrottled = useCallback(async () => {
    if (gameState === 'summary') return; // Don't save completed games
    
    const now = Date.now();
    if (now - lastSaveTimeRef.current < SAVE_THROTTLE_MS) {
      return; // Skip save if within throttle window
    }
    
    lastSaveTimeRef.current = now;
    setSaveStatus('saving');
    
    const sessionData: CustomGameSession = {
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
      scoreResult,
      timestamp: now,
    };
    
    // Update or create slot
    const slot = await getSaveSlot(activeSlotId);
    if (slot) {
      await updateSaveSlot(activeSlotId, sessionData);
    } else {
      await createSaveSlot('Current Game', sessionData, activeSlotId);
    }
    
    // Broadcast update to other tabs
    sessionSyncManager.broadcastSessionUpdate(sessionData);
    
    // Mark as saved after brief delay
    setTimeout(() => setSaveStatus('saved'), 300);
    
    // Return to idle after 2 seconds
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [config, gameState, currentRound, roundScores, target, pingHistory, finalGuess, pingsUsed, elapsedTime, finalTime, gamePhase, targetMoveCount, scoreResult, activeSlotId]);

  // Auto-save session on critical state changes (throttled)
  useEffect(() => {
    saveGameThrottled();
  }, [config, gameState, currentRound, roundScores, target, pingHistory, finalGuess, pingsUsed, gamePhase, targetMoveCount, scoreResult, saveGameThrottled]);

  // Show toast on successful resume
  useEffect(() => {
    if (resumedSession) {
      toast({
        title: 'Game Resumed',
        description: `Continuing from Round ${resumedSession.currentRound}`,
      });
    }
  }, []);

  // Auto-show summary modal when resuming during round-transition
  useEffect(() => {
    if (resumedSession && gameState === 'round-transition' && scoreResult) {
      setShowSummaryModal(true);
    }
  }, []); // Only run on mount

  // Save on page unload/refresh (synchronous fallback to localStorage)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (gameState !== 'summary') {
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
          scoreResult,
          timestamp: Date.now(),
        };
        // Use localStorage as sync fallback for beforeunload
        // (IndexedDB async saves already happen via throttled save)
        try {
          localStorage.setItem('echo_custom_active_session', JSON.stringify(sessionData));
        } catch (e) {
          console.error('Failed to save on unload:', e);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [config, gameState, currentRound, roundScores, target, pingHistory, finalGuess, pingsUsed, elapsedTime, finalTime, gamePhase, targetMoveCount, scoreResult]);

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
      setRoundScores(prev => [...prev, { total: score.total, proximity, pingsUsed, hasWon }]);
      setGameState('round-transition');
      setShowSummaryModal(true); // Auto-show modal like Classic mode
    } else {
      // Final round or single round
      setRoundScores(prev => [...prev, { total: score.total, proximity, pingsUsed, hasWon }]);
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

  const handleRetry = async () => {
    await deleteSaveSlot(activeSlotId);
    
    // Broadcast session clear to other tabs
    sessionSyncManager.broadcastSessionClear();
    
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

  const handleQuitGame = async () => {
    // Ensure latest state is saved before quitting
    const sessionData: CustomGameSession = {
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
      scoreResult,
      timestamp: Date.now(),
    };
    
    // Update or create slot
    const slot = await getSaveSlot(activeSlotId);
    if (slot) {
      await updateSaveSlot(activeSlotId, sessionData);
    } else {
      await createSaveSlot('Current Game', sessionData, activeSlotId);
    }
    
    // Broadcast update to other tabs
    sessionSyncManager.broadcastSessionUpdate(sessionData);
    
    // Show confirmation
    toast({
      title: 'Progress Saved',
      description: 'You can resume this game anytime',
    });
    
    // Small delay to ensure save completes
    setTimeout(() => {
      navigate('/custom');
    }, 100);
  };

  const handleManualSave = async () => {
    const sessionData: CustomGameSession = {
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
      scoreResult,
      timestamp: Date.now(),
    };
    
    // Update or create slot
    const slot = await getSaveSlot(activeSlotId);
    if (slot) {
      await updateSaveSlot(activeSlotId, sessionData);
    } else {
      await createSaveSlot('Current Game', sessionData, activeSlotId);
    }
    
    // Broadcast update to other tabs
    sessionSyncManager.broadcastSessionUpdate(sessionData);
    
    setSaveStatus('saved');
    
    toast({
      title: 'Progress Saved',
      description: 'Your game has been saved successfully',
      duration: 2000,
    });
  };

  // Show loading state while session loads
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'summary' && scoreResult) {
    // Clear session when game is complete
    deleteSaveSlot(activeSlotId);
    sessionSyncManager.broadcastSessionClear();
    
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
        roundScores={roundScores}
        gameState={gameState}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border p-4">
        <div className={cn("mx-auto relative", isMobile ? "max-w-full" : "max-w-6xl")}>
          <div className="flex items-center justify-between">
            {/* Left: Save & Menu */}
            <Button variant="ghost" size="sm" onClick={handleQuitGame} className="hover-lift">
              <Save className="w-4 h-4" />
              {!isMobile && <span className="ml-2">Save & Menu</span>}
            </Button>
            
            {/* Center: Game Title */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-primary" />
                <p className={cn("font-display font-semibold whitespace-nowrap", isMobile ? "text-lg" : "text-heading-3")}>
                  Custom Game
                  {config.numberOfRounds > 1 && ` (${currentRound}/${config.numberOfRounds})`}
                  {config.numberOfRounds === -1 && ` (Round ${currentRound})`}
                </p>
              </div>
            </div>
            
            {/* Right: Manual Save + Settings */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualSave}
                className="hover-lift"
                title="Save progress manually"
              >
                <Save className="w-4 h-4" />
                {!isMobile && <span className="ml-2">Save</span>}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="hover-lift">
                <SettingsIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Save Status Indicator (positioned below header on mobile, inline on desktop) */}
          {!isMobile && (
            <div className="absolute right-0 top-full mt-1 flex items-center gap-3 text-xs">
              {/* Multi-tab indicator */}
              {isMultiTab && (
                <div className="flex items-center gap-1.5 text-accent animate-fade-in">
                  <Users className="w-3 h-3" />
                  <span>Multi-tab active</span>
                </div>
              )}
              
              {/* Save status */}
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1.5 text-muted-foreground animate-fade-in">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  <span>Auto-saving...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1.5 text-accent animate-fade-in">
                  <Check className="w-3 h-3" />
                  <span>Saved</span>
                </div>
              )}
            </div>
          )}
          
          {/* Mobile: Multi-tab and save status below */}
          {isMobile && (isMultiTab || saveStatus !== 'idle') && (
            <div className="flex justify-center mt-2 gap-3">
              {isMultiTab && (
                <div className="text-xs flex items-center gap-1.5 text-accent">
                  <Users className="w-3 h-3" />
                  <span>Multi-tab</span>
                </div>
              )}
              
              {saveStatus !== 'idle' && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {saveStatus === 'saving' && (
                    <>
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                      <span>Saving...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <Check className="w-3 h-3 text-accent" />
                      <span className="text-accent">Saved</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
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
        winCondition={config.winCondition}
        passedCondition={scoreResult.hasWon}
        config={config}
        currentRound={currentRound}
        totalRounds={config.numberOfRounds}
        roundScores={roundScores}
        gameState={gameState}
      />
      )}
    </div>
  );
}
