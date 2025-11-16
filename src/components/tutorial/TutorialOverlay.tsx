import { TutorialStep, TUTORIAL_STEPS } from '@/lib/game/tutorial';
import { Button } from '@/components/ui/button';
import { X, Volume2, ArrowLeftRight, ArrowUpDown } from 'lucide-react';

export interface TutorialOverlayProps {
  step: TutorialStep;
  onNext: () => void;
  onSkip: () => void;
  totalSteps?: number;
  currentStepNumber?: number;
  demoPingsExperienced?: number;
  totalDemoPings?: number;
}

export function TutorialOverlay({
  step,
  onNext,
  onSkip,
  totalSteps = 8,
  currentStepNumber = 1,
  demoPingsExperienced = 0,
  totalDemoPings = 4,
}: TutorialOverlayProps) {
  const stepInfo = TUTORIAL_STEPS[step];

  if (step === 'complete') return null;

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

          {/* Progress Indicator */}
          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < currentStepNumber ? 'bg-primary' : 'bg-border'
                }`}
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

            {/* Actions */}
            <div className="flex gap-3">
              {step !== 'first-ping' && step !== 'confirm-guess' && (
                <Button 
                  onClick={onNext} 
                  className="flex-1"
                  disabled={isAudioCuesStep && !allDemoPingsExperienced}
                >
                  {stepInfo.action || 'Next'}
                </Button>
              )}
              {step === 'welcome' && (
                <Button onClick={onSkip} variant="outline" className="flex-1">
                  Skip Tutorial
                </Button>
              )}
            </div>

            {step !== 'welcome' && (
              <button
                onClick={onSkip}
                className="w-full text-tiny text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip tutorial
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
