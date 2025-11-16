import { TutorialStep, TUTORIAL_STEPS } from '@/lib/game/tutorial';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, ArrowLeftRight, ArrowUpDown } from 'lucide-react';

export interface TutorialOverlayProps {
  step: TutorialStep;
  onNext: () => void;
  onPrevious: () => void;
  onStepChange: (step: TutorialStep) => void;
  onSkip: () => void;
  onExitToMenu: () => void;
  onRestartTutorial?: () => void;
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
  onRestartTutorial,
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
      {/* Non-blocking subtle backdrop */}
      <div className="fixed inset-0 bg-background/30 backdrop-blur-[1px] pointer-events-none z-30 animate-fade-in" />

      {/* Tutorial Panel - Bottom Position */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 animate-slide-in-from-bottom pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="frosted-modal relative shadow-2xl">
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
              
              {/* Interactive Step Indicator */}
              {(step === 'first-ping' || step === 'audio-cues') && (
                <div className="mt-3 flex items-center gap-2 text-xs text-primary/80 bg-primary/10 rounded-lg px-3 py-2">
                  <span className="animate-pulse">👆</span>
                  <span>Click the canvas above to interact</span>
                </div>
              )}
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
                <div className="pt-2 mt-2 border-t border-border/50 space-y-2">
                  <div className="text-xs text-muted-foreground text-center">
                    Demo pings experienced: {demoPingsExperienced} / {totalDemoPings}
                  </div>
                  <Progress 
                    value={(demoPingsExperienced / totalDemoPings) * 100}
                    className="h-1.5"
                  />
                  {allDemoPingsExperienced && (
                    <div className="text-xs text-primary text-center font-semibold animate-fade-in">
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
              
              {/* Footer Navigation */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={onExitToMenu}
                  className="flex-1 text-muted-foreground hover:text-foreground"
                >
                  Exit to Menu
                </Button>
                {onRestartTutorial && (
                  <Button
                    variant="ghost"
                    onClick={onRestartTutorial}
                    className="flex-1 text-muted-foreground hover:text-foreground"
                  >
                    Restart Tutorial
                  </Button>
                )}
              </div>
            </div>
            </div>
          </div>  {/* Closes frosted-modal */}
        </div>  {/* Closes max-w-2xl wrapper */}
      </div>    {/* Closes bottom panel */}
    </>
  );
}
