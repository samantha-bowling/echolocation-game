import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { generateTargetPosition, getTargetCenter, Position } from '@/lib/game/coords';
import { audioEngine } from '@/lib/audio/engine';
import { GameCanvas } from './GameCanvas';
import { GameStats } from './GameStats';
import { TutorialOverlay } from './tutorial/TutorialOverlay';
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

export function TutorialGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [tutorialState, setTutorialState] = useState<{
    currentStep: TutorialStep;
    completed: boolean;
    skipped: boolean;
    pingCount: number;
  }>({
    currentStep: 'welcome',
    completed: false,
    skipped: false,
    pingCount: 0,
  });
  const [target] = useState(() =>
    generateTargetPosition({ width: 800, height: 600 }, 100)
  );
  const [demoPingsExperienced, setDemoPingsExperienced] = useState<Set<string>>(new Set());

  const arenaSize = { width: 800, height: 600 };

  // Demo ping positions for audio-cues step
  const demoPings = [
    { id: 'left-close', position: { x: 100, y: 300 }, label: 'LEFT & CLOSE', description: 'Loud, left speaker' },
    { id: 'right-far', position: { x: 700, y: 300 }, label: 'RIGHT & FAR', description: 'Quiet, right speaker' },
    { id: 'center-top', position: { x: 400, y: 100 }, label: 'ABOVE', description: 'Higher pitch' },
    { id: 'center-bottom', position: { x: 400, y: 500 }, label: 'BELOW', description: 'Lower pitch' },
  ];

  const { gamePhase, finalGuess, setFinalGuess, handlePlaceFinalGuess, resetPhase } = useGamePhase();
  const { elapsedTime, finalTime, resetTimer } = useGameTimer({
    enabled: false,  // Tutorial doesn't need a running timer
    gamePhase,
  });
  const { pingHistory, pingsRemaining, pingsUsed, handlePing, resetPings } = usePingSystem({
    initialPings: 5,
    arenaSize,
    target,
  });

  useEffect(() => {
    audioEngine.initialize();
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
        // Play demo ping sound
        audioEngine.playPing(clickedDemo.position, getTargetCenter(target), 
          Math.max(arenaSize.width, arenaSize.height));
        
        // Mark as experienced
        setDemoPingsExperienced(prev => new Set(prev).add(clickedDemo.id));
      }
      return;
    }

    if (gamePhase === 'pinging') {
      handlePing(clickPos);
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
    'confirm-guess',
    'scoring',
    'complete',
  ];

  const handleStepChange = (newStep: TutorialStep) => {
    // Reset game state when manually changing steps
    resetPings();
    resetTimer();
    resetPhase();
    setDemoPingsExperienced(new Set());
    
    // Update tutorial state
    setTutorialState({
      ...tutorialState,
      currentStep: newStep,
    });
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
      // User should manually click "Place Final Guess" button
      return;
    }

    if (nextStep === 'confirm-guess') {
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

  const getStepNumber = (step: TutorialStep): number => {
    const steps: TutorialStep[] = [
      'welcome',
      'first-ping',
      'interpret-sound',
      'audio-cues',
      'multiple-pings',
      'place-guess',
      'confirm-guess',
      'scoring',
      'complete',
    ];
    return steps.indexOf(step) + 1;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 echo-dots">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Button>
          <h1 className="text-heading-2 font-display">
            Tutorial Mode
          </h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>

        {/* Stats */}
        <GameStats
          pingsRemaining={pingsRemaining}
          pingsUsed={pingsUsed}
          elapsedTime={elapsedTime}
          finalTime={finalTime}
          timerEnabled={false}  // Hide timer in tutorial UI
        />

        {/* Game Canvas */}
        <div className="relative">
          <GameCanvas
            arenaSize={arenaSize}
            target={target}
            pingHistory={pingHistory}
            finalGuess={finalGuess}
            gamePhase={gamePhase}
            gameState="playing"
            showHint={false}
            currentHint={null}
            onCanvasClick={handleCanvasClick}
            canvasRef={canvasRef}
          />
          
          {/* Demo Ping Overlay for audio-cues step */}
          {tutorialState.currentStep === 'audio-cues' && (
            <div className="absolute inset-0 pointer-events-none">
              {demoPings.map(demo => {
                const isExperienced = demoPingsExperienced.has(demo.id);
                return (
                  <div
                    key={demo.id}
                    className="absolute pointer-events-auto cursor-pointer"
                    style={{
                      left: demo.position.x,
                      top: demo.position.y,
                      transform: 'translate(-50%, -50%)',
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
                        <div className="text-center">
                          <div className="text-xs font-bold text-primary-foreground whitespace-nowrap">
                            {demo.label}
                          </div>
                          {isExperienced && (
                            <div className="text-2xl">✓</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Description label */}
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <div className="text-xs bg-background/90 px-2 py-1 rounded border border-border text-foreground">
                          {demo.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
              const newState = { ...tutorialState, currentStep: 'place-guess' as TutorialStep };
              setTutorialState(newState);
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
        currentStepNumber={getStepNumber(tutorialState.currentStep)}
        totalSteps={9}
        demoPingsExperienced={demoPingsExperienced.size}
        totalDemoPings={4}
        stepOrder={stepOrder}
      />
    </div>
  );
}
