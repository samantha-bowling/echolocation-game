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

  const [tutorialState, setTutorialState] = useState(getTutorialState());
  const [target] = useState(() =>
    generateTargetPosition({ width: 800, height: 600 }, 100)
  );

  const arenaSize = { width: 800, height: 600 };

  const { gamePhase, finalGuess, setFinalGuess, handlePlaceFinalGuess, resetPhase } = useGamePhase();
  const { elapsedTime, finalTime, resetTimer } = useGameTimer({
    enabled: true,
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

  // Auto-progress tutorial based on actions
  useEffect(() => {
    const nextStep = getNextStep(tutorialState.currentStep, pingsUsed);
    if (nextStep !== tutorialState.currentStep) {
      const newState = { ...tutorialState, currentStep: nextStep, pingCount: pingsUsed };
      setTutorialState(newState);
      saveTutorialState(newState);
    }
  }, [pingsUsed, tutorialState]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickPos: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (gamePhase === 'pinging') {
      handlePing(clickPos);
    } else if (gamePhase === 'placing') {
      setFinalGuess(clickPos);
      // Advance tutorial to scoring after placing guess
      handleNextStep();
    }
  };

  const handleNextStep = () => {
    const currentSteps: TutorialStep[] = [
      'welcome',
      'first-ping',
      'interpret-sound',
      'multiple-pings',
      'place-guess',
      'confirm-guess',
      'scoring',
      'complete',
    ];
    const currentIndex = currentSteps.indexOf(tutorialState.currentStep);
    const nextStep = currentSteps[Math.min(currentIndex + 1, currentSteps.length - 1)];

    if (nextStep === 'complete') {
      markTutorialCompleted();
      navigate('/classic');
      return;
    }

    if (nextStep === 'place-guess') {
      // User should manually click "Place Final Guess" button
      return;
    }

    if (nextStep === 'confirm-guess') {
      handlePlaceFinalGuess();
    }

    const newState = { ...tutorialState, currentStep: nextStep };
    setTutorialState(newState);
    saveTutorialState(newState);
  };

  const handleSkipTutorial = () => {
    markTutorialCompleted();
    navigate('/classic');
  };

  const getStepNumber = (step: TutorialStep): number => {
    const steps: TutorialStep[] = [
      'welcome',
      'first-ping',
      'interpret-sound',
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
          timerEnabled={true}
        />

        {/* Game Canvas */}
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
        onSkip={handleSkipTutorial}
        currentStepNumber={getStepNumber(tutorialState.currentStep)}
        totalSteps={7}
      />
    </div>
  );
}
