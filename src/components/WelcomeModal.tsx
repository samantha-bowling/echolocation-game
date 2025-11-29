import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Headphones, GraduationCap, Play, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function WelcomeModal({ open, onOpenChange, onComplete }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    onOpenChange(false);
  };

  const handleStartTutorial = () => {
    onComplete();
    onOpenChange(false);
    navigate('/tutorial');
  };

  const handleStartClassic = () => {
    onComplete();
    onOpenChange(false);
    // The ClassicModeDialog will open from MainMenu
  };

  const handleStartCustom = () => {
    onComplete();
    onOpenChange(false);
    navigate('/custom');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden" hideClose>
        {/* Content Area */}
        <div className="flex flex-col p-6 pb-4 min-h-[280px]">
          {currentStep === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="space-y-3">
                <h2 className="text-2xl font-display font-bold">
                  A game about finding what you can't see
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Using binaural 3D audio and careful listening, you'll hunt invisible targets through sound alone—sending pings, hearing echoes, and trusting your ears over your eyes.
                </p>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <Headphones className="w-8 h-8 text-accent" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-display font-bold">
                  Best with headphones
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  This game uses spatial audio to create a 3D soundscape. For the best experience, use headphones and find a quiet space.
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-display font-bold">
                  Ready to begin?
                </h2>
                <p className="text-sm text-muted-foreground">
                  We recommend starting with the tutorial
                </p>
              </div>
              
              <div className="w-full space-y-3">
                <Button
                  onClick={handleStartTutorial}
                  size="lg"
                  className="w-full h-12 text-base font-semibold group"
                >
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Start with Tutorial
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-background/20">
                    Recommended
                  </span>
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={handleStartClassic}
                    variant="outline"
                    size="lg"
                    className="flex-1 h-10 text-sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Classic Mode
                  </Button>
                  <Button
                    onClick={handleStartCustom}
                    variant="outline"
                    size="lg"
                    className="flex-1 h-10 text-sm"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Custom Mode
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-between bg-muted/30">
          {/* Left: Skip or Back */}
          <div className="w-24">
            {currentStep === 0 ? (
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Center: Step Indicators */}
          <div className="flex gap-2">
            {[0, 1, 2].map((step) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  step === currentStep
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to step ${step + 1}`}
              />
            ))}
          </div>

          {/* Right: Next */}
          <div className="w-24 flex justify-end">
            {currentStep < 2 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className="h-8"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
