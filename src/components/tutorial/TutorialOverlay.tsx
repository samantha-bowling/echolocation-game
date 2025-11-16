import { TutorialStep, TUTORIAL_STEPS } from '@/lib/game/tutorial';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface TutorialOverlayProps {
  step: TutorialStep;
  onNext: () => void;
  onSkip: () => void;
  totalSteps?: number;
  currentStepNumber?: number;
}

export function TutorialOverlay({
  step,
  onNext,
  onSkip,
  totalSteps = 8,
  currentStepNumber = 1,
}: TutorialOverlayProps) {
  const stepInfo = TUTORIAL_STEPS[step];

  if (step === 'complete') return null;

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

            {/* Actions */}
            <div className="flex gap-3">
              {step !== 'first-ping' && step !== 'confirm-guess' && (
                <Button onClick={onNext} className="flex-1">
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
