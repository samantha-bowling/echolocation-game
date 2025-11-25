import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowLeft, Target } from 'lucide-react';
import { generateTargetPosition, getTargetCenter, Position } from '@/lib/game/coords';
import { audioEngine } from '@/lib/audio/engine';
import { GameCanvas } from './GameCanvas';
import { GameStats } from './GameStats';
import { TutorialOverlay } from './tutorial/TutorialOverlay';
import { TutorialScoreExample } from './tutorial/TutorialScoreExample';
import {
  getTutorialState,
  saveTutorialState,
  getNextStep,
  markTutorialCompleted,
  TutorialStep,
} from '@/lib/game/tutorial';
import { useGameTimer } from '@/hooks/useGameTimer';
import { usePingSystem } from '@/hooks/usePingSystem';
import { useGamePhase } from '@/hooks/useGamePhase';
import { useHintSystem } from '@/hooks/useHintSystem';
import { calculateScore } from '@/lib/game/scoring';
import { calculateProximity } from '@/lib/game/distance';
import { useIsMobile } from '@/hooks/use-mobile';

export function TutorialGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const [tutorialState, setTutorialState] = useState<{
    currentStep: TutorialStep;
    completed: boolean;
    skipped: boolean;
    pingCount: number;
    replaysUsed: number;
  }>({
    currentStep: 'welcome',
    completed: false,
    skipped: false,
    pingCount: 0,
    replaysUsed: 0,
  });
  const [demoPingsExperienced, setDemoPingsExperienced] = useState<Set<string>>(new Set());
  const [isModalMinimized, setIsModalMinimized] = useState(false);

  // Responsive arena sizing
  const arenaSize = useMemo(() => {
    if (isMobile) {
      const vw = Math.min(window.innerWidth - 32, 600);
      const vh = Math.min(window.innerHeight - 400, vw * 0.75);
      return { width: vw, height: vh };
    }
    return { width: 800, height: 600 };
  }, [isMobile]);

  // Generate target with responsive arena size
  const [target, setTarget] = useState<any>(null);
  
  useEffect(() => {
    if (arenaSize.width > 0 && !target) {
      setTarget(generateTargetPosition(arenaSize, 100));
    }
  }, [arenaSize, target]);
  
  // Fixed reference target for audio-cues demo (center of arena)
  const demoReferenceTarget = useMemo(() => ({
    x: arenaSize.width / 2,
    y: arenaSize.height / 2
  }), [arenaSize]);

  // Demo ping positions - using relative coordinates (0-1 scale) that scale with arena
  const demoPingsRelative = [
    // Core positions (isolated cues)
    { id: 'left-close', relX: 0.375, relY: 0.5, label: 'LEFT & CLOSE', description: 'Loud, left speaker' },
    { id: 'right-far', relX: 0.875, relY: 0.5, label: 'RIGHT & FAR', description: 'Quiet, right speaker' },
    { id: 'center-top', relX: 0.5, relY: 0.75, label: 'TARGET ABOVE', description: 'Sound travels up, higher pitch' },
    { id: 'center-bottom', relX: 0.5, relY: 0.25, label: 'TARGET BELOW', description: 'Sound travels down, lower pitch' },
    
    // Combination positions (teaching how cues combine)
    { id: 'top-left', relX: 0.375, relY: 0.25, label: 'TOP-LEFT', description: 'Left speaker, lower pitch, medium volume' },
    { id: 'top-right-far', relX: 0.8125, relY: 0.25, label: 'TOP-RIGHT & FAR', description: 'Right speaker, lower pitch, quieter' },
    { id: 'bottom-left-close', relX: 0.4, relY: 0.75, label: 'BOTTOM-LEFT & CLOSE', description: 'Left speaker, higher pitch, louder' },
    { id: 'bottom-right', relX: 0.75, relY: 0.75, label: 'BOTTOM-RIGHT', description: 'Right speaker, higher pitch, medium volume' },
  ];

  // Calculate actual positions based on arena size
  const demoPings = useMemo(() => 
    demoPingsRelative.map(ping => ({
      ...ping,
      position: { x: ping.relX * arenaSize.width, y: ping.relY * arenaSize.height }
    })),
    [arenaSize]
  );

  const { gamePhase, finalGuess, setFinalGuess, handlePlaceFinalGuess, resetPhase } = useGamePhase();
  const { elapsedTime, finalTime, resetTimer, startTimer } = useGameTimer({
    enabled: false,  // Tutorial doesn't need a running timer
    gamePhase,
    startOnFirstPing: true
  });
  
  // Limited pings for the triangulation step
  const isTriangulationStep = tutorialState.currentStep === 'multiple-pings';
  const { pingHistory, pingsRemaining, pingsUsed, handlePing, handleReplayPing, replaysRemaining, replaysUsed: replaysUsedCount, resetPings } = usePingSystem({
    initialPings: isTriangulationStep ? 6 : 999,  // 6 pings for triangulation, unlimited for exploration
    arenaSize,
    target,
  });

  // Enable hints during triangulation step
  const { currentHint, showHint, dismissHint, resetHints } = useHintSystem({
    enabled: isTriangulationStep,
    pingsUsed,
    totalPings: 6,
    target,
    pingHistory,
  });

  useEffect(() => {
    audioEngine.initialize(arenaSize.width, arenaSize.height);
    
    // Load saved audio preferences
    const savedTheme = localStorage.getItem('echo_audio_theme');
    const savedVolume = localStorage.getItem('echo_volume');
    
    if (savedTheme) {
      audioEngine.setTheme(savedTheme);
    }
    if (savedVolume) {
      audioEngine.setVolume(parseInt(savedVolume) / 100);
    }

    // Cleanup on unmount
    return () => {
      audioEngine.cleanup();
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickPos: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Special handling for audio-cues demo mode
    if (tutorialState.currentStep === 'audio-cues') {
      const clickedDemo = demoPings.find(demo => {
        const dx = clickPos.x - demo.position.x;
        const dy = clickPos.y - demo.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= 40; // 40px click radius
      });

      if (clickedDemo) {
        // Play demo ping sound with fixed reference target
        audioEngine.playPing(clickedDemo.position, demoReferenceTarget, 
          Math.max(arenaSize.width, arenaSize.height));
        
        // Mark as experienced
        setDemoPingsExperienced(prev => new Set(prev).add(clickedDemo.id));
      }
      return;
    }

    if (gamePhase === 'pinging') {
      const isFirstPing = tutorialState.pingCount === 0;
      const success = handlePing(clickPos);
      if (success) {
        // Start timer on first ping (tutorial step tracking)
        if (isFirstPing) {
          startTimer();
        }
        
        setTutorialState(prev => ({
          ...prev,
          pingCount: prev.pingCount + 1,
        }));
      }
    } else if (gamePhase === 'placing') {
      setFinalGuess(clickPos);
      // Advance tutorial to scoring after placing guess
      handleNextStep();
    }
  };

  const stepOrder: TutorialStep[] = [
    'welcome',
    'first-ping',
    'interpret-sound',
    'audio-cues',
    'multiple-pings',
    'place-guess',
    'scoring',
    'complete',
  ];

  const handleStepChange = (newStep: TutorialStep) => {
    // Only reset pings if moving to earlier steps or restarting
    const shouldResetPings = 
      stepOrder.indexOf(newStep) < stepOrder.indexOf('multiple-pings') ||
      newStep === 'complete';
    
    if (shouldResetPings) {
      resetPings();
      resetHints();
    }
    
    resetTimer();
    
    // Preserve finalGuess when viewing scoring step
    if (newStep !== 'scoring' && tutorialState.currentStep !== 'scoring') {
      resetPhase();
    }
    setDemoPingsExperienced(new Set());
    
    // Update and save tutorial state
    const newState = {
      ...tutorialState,
      currentStep: newStep,
      replaysUsed: tutorialState.replaysUsed || 0,
    };
    setTutorialState(newState);
    saveTutorialState(newState);
  };

  const handlePreviousStep = () => {
    const currentIndex = stepOrder.indexOf(tutorialState.currentStep);
    if (currentIndex > 0) {
      handleStepChange(stepOrder[currentIndex - 1]);
    }
  };

  const handleNextStep = () => {
    const currentIndex = stepOrder.indexOf(tutorialState.currentStep);
    const nextStep = stepOrder[Math.min(currentIndex + 1, stepOrder.length - 1)];

    if (nextStep === 'place-guess') {
      handlePlaceFinalGuess();
    }

    handleStepChange(nextStep);
  };

  const handleSkipTutorial = () => {
    navigate('/');
  };

  const handleExitToMenu = () => {
    navigate('/');
  };

  const handleRestartTutorial = () => {
    // Reset tutorial to beginning
    const newState = {
      currentStep: 'welcome' as TutorialStep,
      completed: false,
      skipped: false,
      pingCount: 0,
      replaysUsed: 0,
    };
    setTutorialState(newState);
    saveTutorialState(newState);
    
    // Reset all game state
    resetPings();
    resetTimer();
    resetPhase();
    setFinalGuess(null);
    setDemoPingsExperienced(new Set());
  };

  const getStepNumber = (step: TutorialStep): number => {
    const steps: TutorialStep[] = [
      'welcome',
      'first-ping',
      'interpret-sound',
      'audio-cues',
      'multiple-pings',
      'place-guess',
      'scoring',
      'complete',
    ];
    return steps.indexOf(step) + 1;
  };

  // Calculate actual score when on scoring step
  const actualProximity = finalGuess 
    ? calculateProximity(
        finalGuess,
        getTargetCenter(target),
        Math.sqrt(arenaSize.width * arenaSize.width + arenaSize.height * arenaSize.height)
      )
    : null;

  const actualScore = tutorialState.currentStep === 'scoring' && finalGuess && actualProximity !== null
    ? calculateScore(
        actualProximity, // proximity 0-100
        pingHistory.length, // pingsUsed
        6, // totalPings
        finalTime || elapsedTime, // timeSeconds
        1, // chapter (tutorial is like chapter 1)
        tutorialState.replaysUsed, // replaysUsed
        undefined, // replaysAvailable (tutorial has unlimited replays)
        false // hintUsed (tutorial doesn't penalize hints)
      )
    : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 pb-80 echo-dots">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center">
          <h1 className="text-heading-2 font-display">
            Tutorial Mode
          </h1>
        </div>


        {/* Game Canvas */}
        <div className="relative">
          <GameCanvas
            arenaSize={arenaSize}
            target={target}
            pingHistory={pingHistory.slice(-5)}
            finalGuess={finalGuess}
            gamePhase={gamePhase}
            gameState={tutorialState.currentStep === 'scoring' ? 'summary' : 'playing'}
            showHint={showHint && isTriangulationStep}
            currentHint={currentHint}
            onCanvasClick={handleCanvasClick}
            onPingReplay={handleReplayPing}
            replaysRemaining={replaysRemaining}
            replaysUsed={replaysUsedCount}
            canvasRef={canvasRef}
          />
          
          {/* Demo Ping Overlay for audio-cues step */}
          {tutorialState.currentStep === 'audio-cues' && (
            <TooltipProvider>
              <div className="absolute inset-0 pointer-events-none z-10">
                {/* Target location indicator - FIXED at center for educational demo */}
                <div
                  className="absolute pointer-events-none z-30"
                  style={{
                    left: demoReferenceTarget.x,
                    top: demoReferenceTarget.y,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-accent/60 animate-pulse flex items-center justify-center">
                    <Target className="w-6 h-6 text-accent" />
                  </div>
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <div className="text-xs bg-accent/20 px-3 py-1.5 rounded-full border border-accent/40 text-accent font-semibold">
                      🎯 REFERENCE TARGET
                    </div>
                  </div>
                </div>
                
                {demoPings.map(demo => {
                  const isExperienced = demoPingsExperienced.has(demo.id);
                  return (
                    <Tooltip key={demo.id} delayDuration={200}>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute pointer-events-auto cursor-pointer hover:scale-110 transition-transform z-20"
                          style={{
                            left: demo.position.x,
                            top: demo.position.y,
                            transform: 'translate(-50%, -50%)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Play demo ping with fixed reference target
                            audioEngine.playPing(
                              demo.position,
                              demoReferenceTarget,
                              Math.max(arenaSize.width, arenaSize.height)
                            );
                            // Mark as experienced
                            setDemoPingsExperienced(prev => new Set(prev).add(demo.id));
                          }}
                        >
                          <div className={`relative transition-all ${isExperienced ? 'opacity-50' : 'opacity-100'}`}>
                            {/* Pulse animation */}
                            <div className={`absolute inset-0 ${!isExperienced ? 'animate-ping' : ''}`}>
                              <div className="w-20 h-20 rounded-full bg-primary/30" />
                            </div>
                            
                            {/* Main circle */}
                            <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
                              isExperienced 
                                ? 'bg-primary/20 border-primary/50' 
                                : 'bg-primary/40 border-primary hover:scale-110'
                            }`}>
                              <div className="text-center px-2">
                                <div className="text-xs font-bold text-primary-foreground leading-tight max-w-[70px]">
                                  {demo.label}
                                </div>
                                {isExperienced && (
                                  <div className="text-2xl">✓</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">{demo.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          )}
        </div>

        {/* Action Buttons */}
        {gamePhase === 'pinging' && tutorialState.currentStep === 'place-guess' && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handlePlaceFinalGuess}
              className="hover-lift"
            >
              Place Final Guess
            </Button>
          </div>
        )}

        {gamePhase === 'confirming' && (
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                resetPhase();
                setFinalGuess(null);
                // Stay on current step - don't reset
              }}
            >
              Reposition
            </Button>
            <Button
              size="lg"
              onClick={handleNextStep}
              className="hover-lift"
            >
              Confirm & Continue
            </Button>
          </div>
        )}
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay
        step={tutorialState.currentStep}
        onNext={handleNextStep}
        onPrevious={handlePreviousStep}
        onStepChange={handleStepChange}
        onSkip={handleSkipTutorial}
        onExitToMenu={handleExitToMenu}
        onRestartTutorial={handleRestartTutorial}
        isMinimized={isModalMinimized}
        onToggleMinimize={() => setIsModalMinimized(!isModalMinimized)}
        totalSteps={8}
        currentStepNumber={getStepNumber(tutorialState.currentStep)}
        demoPingsExperienced={demoPingsExperienced.size}
        totalDemoPings={8}
        stepOrder={stepOrder}
        actualScore={actualScore}
        proximity={actualProximity}
        pingsUsed={pingHistory.length}
        totalPings={6}
        timeElapsed={finalTime || elapsedTime}
      />

      {/* Score Example Overlay for scoring step */}
    </div>
  );
}
