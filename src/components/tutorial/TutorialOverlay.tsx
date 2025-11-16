import { TutorialStep, TUTORIAL_STEPS } from '@/lib/game/tutorial';
import { Button } from '@/components/ui/button';
import { X, Volume2, ArrowLeftRight, ArrowUpDown } from 'lucide-react';

export interface TutorialOverlayProps {
  step: TutorialStep;
  onNext: () => void;
  onPrevious: () => void;
  onStepChange: (step: TutorialStep) => void;
  onSkip: () => void;
  onExitToMenu: () => void;
  totalSteps?: number;
  currentStepNumber?: number;
  demoPingsExperienced?: number;
  totalDemoPings?: number;
  stepOrder: TutorialStep[];
}

export function TutorialOverlay({
  step,
  onNext,
  onPrevious,
  onStepChange,
  onSkip,
  onExitToMenu,
  totalSteps = 9,
  currentStepNumber = 1,
  demoPingsExperienced = 0,
  totalDemoPings = 4,
  stepOrder,
}: TutorialOverlayProps) {
  const stepInfo = TUTORIAL_STEPS[step];

  // Celebration screen for complete step
  if (step === 'complete') {
    return (
      <>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4">
          <div className="frosted-modal text-center space-y-6">
            <div className="space-y-2">
              <div className="text-6xl">🎉</div>
              <h2 className="text-heading-2">You're Ready!</h2>
              <p className="text-muted-foreground">
                You've learned all the mechanics. Time to test your echolocation skills!
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onStepChange('welcome')}
                className="flex-1"
              >
                Restart Tutorial
              </Button>
              <Button
                onClick={onExitToMenu}
                className="flex-1"
              >
                Start Playing
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isAudioCuesStep = step === 'audio-cues';
  const allDemoPingsExperienced = demoPingsExperienced >= totalDemoPings;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 animate-fade-in" />

      {/* Tutorial Tooltip */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4 animate-fade-in">
        <div className="frosted-modal relative">
          {/* Close/Skip Button */}
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Skip tutorial"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Step Navigation Dots */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {stepOrder.map((stepName, i) => (
              <button
                key={i}
                onClick={() => onStepChange(stepName)}
                className={`transition-all hover:scale-125 rounded-full ${
                  i === currentStepNumber - 1
                    ? 'bg-primary w-8 h-2.5'
                    : i < currentStepNumber - 1
                    ? 'bg-primary/50 w-2.5 h-2.5'
                    : 'bg-border w-2.5 h-2.5'
                }`}
                aria-label={`Go to step ${i + 1}`}
                title={TUTORIAL_STEPS[stepName].title}
              />
            ))}
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <h2 className="text-heading-3 mb-2">{stepInfo.title}</h2>
              <p className="text-small text-muted-foreground leading-relaxed">
                {stepInfo.description}
              </p>
            </div>

            {/* Audio Cues Visual Diagram */}
            {isAudioCuesStep && (
              <div className="space-y-3 py-3 border-y border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Left / Right</div>
                    <div className="text-xs text-muted-foreground">Stereo panning in headphones</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Distance</div>
                    <div className="text-xs text-muted-foreground">Volume: louder = closer</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <ArrowUpDown className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Above / Below</div>
                    <div className="text-xs text-muted-foreground">Pitch: higher = above you</div>
                  </div>
                </div>
                
                {/* Demo Progress */}
                <div className="pt-2 mt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground text-center">
                    Demo pings experienced: {demoPingsExperienced} / {totalDemoPings}
                  </div>
                  {allDemoPingsExperienced && (
                    <div className="text-xs text-primary text-center mt-1 font-semibold animate-fade-in">
                      ✓ All demos completed! Click Continue when ready.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="space-y-2">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onPrevious}
                  disabled={currentStepNumber === 1}
                  className="flex-1"
                >
                  ← Previous
                </Button>
                <Button
                  onClick={onNext}
                  disabled={isAudioCuesStep && !allDemoPingsExperienced}
                  className="flex-1"
                >
                  {stepInfo.action || 'Next'} →
                </Button>
              </div>
              
              {/* Exit to Menu - Always Visible */}
              <Button
                variant="ghost"
                onClick={onExitToMenu}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Exit to Menu
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
