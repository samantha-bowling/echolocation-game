import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Headphones, Target, Radio, Volume2 } from 'lucide-react';
import { audioEngine } from '@/lib/audio/engine';
import { toast } from 'sonner';

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClassicMode: () => void;
}

export const WelcomeModal = ({ open, onOpenChange, onClassicMode }: WelcomeModalProps) => {
  const navigate = useNavigate();
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [pingAnimation, setPingAnimation] = useState(false);

  // Animated ping demo effect
  useEffect(() => {
    if (currentSlide === 1 && open) {
      const interval = setInterval(() => {
        setPingAnimation(true);
        setTimeout(() => setPingAnimation(false), 1500);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentSlide, open]);

  const handleClose = (action?: string) => {
    if (dontShowAgain) {
      localStorage.setItem('echo_welcome_dismissed', 'true');
    }
    localStorage.setItem('echo_welcome_shown', 'true');
    
    if (action === 'tutorial') {
      navigate('/tutorial');
    } else if (action === 'classic') {
      onClassicMode();
    } else if (action === 'custom') {
      navigate('/custom');
    }
    
    onOpenChange(false);
  };

  const handleAudioTest = async () => {
    setIsTestingAudio(true);
    try {
      await audioEngine.playPreview();
      toast.success('Audio test complete! You should have heard a ping sound.');
    } catch (error) {
      toast.error('Could not play audio. Please check your headphones.');
    } finally {
      setIsTestingAudio(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-visible [&>button]:hidden">
        <Carousel 
          className="w-full"
          opts={{ loop: false }}
          setApi={(api) => {
            if (!api) return;
            setCurrentSlide(api.selectedScrollSnap());
            api.on('select', () => {
              setCurrentSlide(api.selectedScrollSnap());
            });
          }}
        >
          <CarouselContent>
            {/* Slide 1: Welcome & Introduction */}
            <CarouselItem>
              <div className="p-8 space-y-6 min-h-[500px] flex flex-col">
                <div className="flex-1 space-y-6">
                  <div className="text-center space-y-3">
                    <h2 className="text-3xl font-bold text-foreground">
                      Welcome to echo)))location
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      A game about finding what you can't see
                    </p>
                  </div>

                  <div className="space-y-4 text-center max-w-lg mx-auto">
                    <p className="text-foreground/90">
                      Using <span className="font-semibold text-primary">binaural 3D audio</span> and careful listening, 
                      you hunt invisible targets through sound alone.
                    </p>
                    <p className="text-muted-foreground">
                      Send pings into the darkness, hear the echoes bounce back, 
                      and use your ears to triangulate hidden targets.
                    </p>
                  </div>
                </div>

                {/* Navigation footer */}
                <div className="flex flex-col items-center gap-3 pt-4">
                  <div className="flex items-center justify-center gap-6">
                    {currentSlide > 0 && (
                      <CarouselPrevious className="!static !transform-none" />
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div className="w-2 h-2 rounded-full bg-muted"></div>
                      <div className="w-2 h-2 rounded-full bg-muted"></div>
                    </div>
                    {currentSlide < 2 && (
                      <CarouselNext className="!static !transform-none" />
                    )}
                  </div>
                  <button
                    onClick={() => handleClose()}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 2: How It Works */}
            <CarouselItem>
              <div className="p-8 space-y-6 min-h-[500px] flex flex-col">
                <div className="flex-1 space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                      How Echolocation Works
                    </h2>
                    <p className="text-muted-foreground">
                      Your journey in three simple steps
                    </p>
                  </div>

                  <div className="relative max-w-md mx-auto h-48 flex items-center justify-center bg-gradient-to-br from-background to-muted/20 rounded-lg border border-border">
                    {/* Animated ping demo */}
                    <div className="relative">
                      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1500 ${
                        pingAnimation ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
                      }`}>
                        <div className="w-16 h-16 rounded-full border-4 border-primary/40"></div>
                      </div>
                      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1500 delay-300 ${
                        pingAnimation ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
                      }`}>
                        <div className="w-24 h-24 rounded-full border-2 border-primary/20"></div>
                      </div>
                      <Radio className={`w-8 h-8 text-primary transition-all duration-300 ${
                        pingAnimation ? 'scale-110' : 'scale-100'
                      }`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Radio className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">1. Send Pings</h3>
                        <p className="text-sm text-muted-foreground">Click to send sound waves into the arena</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Headphones className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">2. Listen Carefully</h3>
                        <p className="text-sm text-muted-foreground">Hear echoes from the hidden target</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">3. Mark Your Guess</h3>
                        <p className="text-sm text-muted-foreground">Click where you think the target is</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation footer */}
                <div className="flex flex-col items-center gap-3 pt-4">
                  <div className="flex items-center justify-center gap-6">
                    {currentSlide > 0 && (
                      <CarouselPrevious className="!static !transform-none" />
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted"></div>
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div className="w-2 h-2 rounded-full bg-muted"></div>
                    </div>
                    {currentSlide < 2 && (
                      <CarouselNext className="!static !transform-none" />
                    )}
                  </div>
                  <button
                    onClick={() => handleClose()}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 3: Setup & Get Started */}
            <CarouselItem>
              <div className="p-8 space-y-6 min-h-[500px] flex flex-col">
                <div className="flex-1 space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                      Ready to Begin?
                    </h2>
                    <p className="text-muted-foreground">
                      Let's make sure you're set up for success
                    </p>
                  </div>

                  {/* Headphones requirement */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Headphones className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Headphones Required</h3>
                        <p className="text-sm text-muted-foreground">
                          This game uses 3D spatial audio for the best experience
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleAudioTest}
                      disabled={isTestingAudio}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      {isTestingAudio ? 'Testing Audio...' : 'Test Your Audio Setup'}
                    </Button>
                  </div>

                  {/* CTA Section */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        We recommend starting with the tutorial
                      </p>
                      <Button
                        onClick={() => handleClose('tutorial')}
                        size="lg"
                        className="w-full max-w-sm"
                      >
                        Start Tutorial
                        <span className="ml-2 text-xs opacity-70">(~3 minutes)</span>
                      </Button>
                    </div>

                    <div className="text-center space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Already know how to play?
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => handleClose('classic')}
                          variant="outline"
                          size="sm"
                        >
                          Classic Mode
                        </Button>
                        <Button
                          onClick={() => handleClose('custom')}
                          variant="outline"
                          size="sm"
                        >
                          Custom Mode
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Don't show again */}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Checkbox
                      id="dont-show"
                      checked={dontShowAgain}
                      onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                    />
                    <label
                      htmlFor="dont-show"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Don't show this again
                    </label>
                  </div>
                </div>

                {/* Navigation footer */}
                <div className="flex flex-col items-center gap-3 pt-4">
                  <div className="flex items-center justify-center gap-6">
                    {currentSlide > 0 && (
                      <CarouselPrevious className="!static !transform-none" />
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted"></div>
                      <div className="w-2 h-2 rounded-full bg-muted"></div>
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    {currentSlide < 2 && (
                      <CarouselNext className="!static !transform-none" />
                    )}
                  </div>
                  <button
                    onClick={() => handleClose()}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </DialogContent>
    </Dialog>
  );
};
