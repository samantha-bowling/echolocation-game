import { TutorialStep, TUTORIAL_STEPS } from '@/lib/game/tutorial';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Volume2, ArrowLeftRight, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { TutorialScoreExample } from './TutorialScoreExample';

export interface TutorialOverlayProps {
  step: TutorialStep;
  onNext: () => void;
  onPrevious: () => void;
  onStepChange: (step: TutorialStep) => void;
  onSkip: () => void;
  onExitToMenu: () => void;
  onRestartTutorial?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
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
  isMinimized = false,
  onToggleMinimize,
  totalSteps = 8,
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
      {/* Non-blocking subtle backdrop - only when not minimized */}
      {!isMinimized && (
        <div className="fixed inset-0 bg-background/30 backdrop-blur-[1px] pointer-events-none z-30 animate-fade-in" />
      )}

      {/* Tutorial Panel - Bottom Position */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          {isMinimized ? (
            // Minimized view - compact pill
            <div className="frosted-modal py-3 px-4 flex items-center justify-between gap-4 animate-slide-in-from-bottom">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-xs text-muted-foreground font-medium shrink-0">
                  Step {currentStepNumber}/{totalSteps}
                </div>
                <div className="text-sm font-medium truncate">
                  {stepInfo.title}
                </div>
              </div>
              <Button
                size="sm"
                onClick={onToggleMinimize}
                className="shrink-0"
              >
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Tutorial
              </Button>
            </div>
          ) : (
            // Full modal view
            <div className="frosted-modal relative shadow-2xl animate-slide-in-from-bottom py-4 px-6">
              {/* Minimize button */}
              {onToggleMinimize && (
                <button
                  onClick={onToggleMinimize}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors z-10"
                  aria-label="Minimize tutorial"
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              )}

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
              <ScrollArea className="max-h-[60vh] md:max-h-[70vh] pr-4">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-heading-3 mb-2">{stepInfo.title}</h2>
                    <p className="text-small text-muted-foreground leading-relaxed">
                      {stepInfo.description}
                    </p>
                    
                    {/* Interactive Step Indicator */}
                    {(step === 'first-ping' || step === 'audio-cues' || step === 'multiple-pings' || step === 'place-guess') && (
                      <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ChevronDown className="w-4 h-4 text-primary" />
                          <p className="text-sm font-medium text-primary">
                            {step === 'place-guess' 
                              ? 'Minimize this panel, click "Place Final Guess", then click where you think the target is' 
                              : 'Minimize this panel and click on the canvas to interact'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audio Cues Visual Demo */}
                  {isAudioCuesStep && (
                    <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border">
                      <div className="text-sm font-semibold text-foreground mb-2">
                        What you'll hear:
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="flex flex-col items-center gap-1.5 p-2 bg-background/50 rounded">
                          <ArrowLeftRight className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">Stereo Pan</span>
                          <span className="text-muted-foreground text-center">Left/Right speaker</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 p-2 bg-background/50 rounded">
                          <Volume2 className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">Volume</span>
                          <span className="text-muted-foreground text-center">Distance cue</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 p-2 bg-background/50 rounded">
                          <ArrowUpDown className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">Pitch</span>
                          <span className="text-muted-foreground text-center">High = up, Low = down</span>
                        </div>
                      </div>

                      {/* Progress indicator for demo pings */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Demo pings experienced</span>
                          <span className="font-medium text-foreground">
                            {demoPingsExperienced}/{totalDemoPings}
                          </span>
                        </div>
                        <Progress 
                          value={(demoPingsExperienced / totalDemoPings) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Score Example for scoring step */}
                  {step === 'scoring' && (
                    <div className="mt-4">
                      <TutorialScoreExample />
                    </div>
                  )}
                </div>
              </ScrollArea>
                
              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-2">
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
          )}
        </div>
      </div>
    </>
  );
}
