import { Link } from 'react-router-dom';
import { Play, Wand2, Settings, Heart, Headphones, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { isTutorialCompleted } from '@/lib/game/tutorial';
import { ClassicModeDialog } from '@/components/ClassicModeDialog';
import { isCheatActive } from '@/lib/game/cheats';
import { cn } from '@/lib/utils';
export function MainMenu() {
  const [hasSave, setHasSave] = useState(false);
  const [saveDetails, setSaveDetails] = useState<{
    level: number;
    chapter: number;
  } | null>(null);
  const [tutorialCompleted, setTutorialCompleted] = useState(true);
  const [showClassicDialog, setShowClassicDialog] = useState(false);
  const [whiskersActive, setWhiskersActive] = useState(false);
  const [showWhiskers, setShowWhiskers] = useState(false);
  const [renderedLines, setRenderedLines] = useState(0);

  const handleNewRun = () => {
    localStorage.setItem('echo_reset_classic', 'true');
  };
  useEffect(() => {
    // Check tutorial status
    setTutorialCompleted(isTutorialCompleted());

    // Check localStorage for existing save (temporary until Supabase is connected)
    const savedProgress = localStorage.getItem('echo_classic_progress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        if (progress.level > 1) {
          setHasSave(true);
          setSaveDetails({
            level: progress.level,
            chapter: progress.chapter
          });
        }
      } catch {
        setHasSave(false);
      }
    }

    // Check WHISKERS cheat status
    const isActive = isCheatActive('WHISKERS');
    setWhiskersActive(isActive);
    if (isActive) {
      setShowWhiskers(true);
    }
  }, []);

  // Listen for storage changes (cheat toggle in Settings)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'echo_cheat_whiskers') {
        const isActive = e.newValue === 'true';
        setWhiskersActive(isActive);
        if (isActive) {
          setShowWhiskers(true);
          setRenderedLines(0); // Reset animation
        } else {
          setShowWhiskers(false);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Store ASCII art content
  const [whiskersAscii, setWhiskersAscii] = useState('');

  // Load ASCII art on mount
  useEffect(() => {
    fetch('/whiskers.txt')
      .then(res => res.text())
      .then(text => setWhiskersAscii(text))
      .catch(() => setWhiskersAscii(''));
  }, []);

  // Implement line-by-line animation
  const ENABLE_TYPEWRITER = true;
  const LINES_PER_FRAME = 3;
  const FRAME_DELAY = 50;

  useEffect(() => {
    if (!showWhiskers || !whiskersActive || !whiskersAscii) {
      setRenderedLines(0);
      return;
    }
    
    if (!ENABLE_TYPEWRITER) {
      setRenderedLines(165);
      return;
    }
    
    // Reset animation when showing
    setRenderedLines(0);
    
    const lines = whiskersAscii.split('\n');
    const totalLines = lines.length;
    let currentLine = 0;
    
    const interval = setInterval(() => {
      currentLine += LINES_PER_FRAME;
      
      if (currentLine >= totalLines) {
        setRenderedLines(totalLines);
        clearInterval(interval);
      } else {
        setRenderedLines(currentLine);
      }
    }, FRAME_DELAY);
    
    return () => clearInterval(interval);
  }, [showWhiskers, whiskersActive, whiskersAscii]);
  return <div className={cn(
    "min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden",
    whiskersActive && showWhiskers ? "" : "echo-dots"
  )}>
      {whiskersActive && showWhiskers && whiskersAscii && (
        <div 
          className="fixed inset-0 z-0 flex items-center justify-center p-4 bg-background cursor-pointer overflow-hidden"
          onClick={() => setShowWhiskers(false)}
        >
          <pre className="font-mono text-[3px] sm:text-[4px] md:text-[5px] lg:text-[6px] leading-[1.1] text-muted-foreground/40 select-none whitespace-pre max-w-full overflow-hidden">
            {whiskersAscii.split('\n').slice(0, renderedLines).join('\n')}
          </pre>
        </div>
      )}
      <div className="max-w-2xl w-full space-y-12 animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center space-y-4">
          <h1 className="text-display font-display tracking-tight">
            echo<span className="text-primary">)))</span>location
          </h1>
          <p className="text-muted-foreground text-small">
            Find the hidden target using only sound
          </p>
        </div>

        {/* Headphones Banner */}
        <div className={cn(
          "flat-card",
          whiskersActive && showWhiskers
            ? "!bg-transparent border-2 !border-accent/40"
            : "bg-accent/30 border-accent/30 backdrop-blur-sm"
        )}>
          <div className="flex items-center justify-center gap-3 text-foreground">
            <Headphones className="w-5 h-5 text-foreground/70" />
            <p className="text-small font-medium">Headphones recommended for best experience</p>
          </div>
        </div>


        {/* Main Actions */}
        <div className="space-y-8">
          <Button 
            size="lg" 
            className={cn(
              "w-full h-14 text-base font-semibold hover-lift",
              whiskersActive && showWhiskers 
                ? "!bg-transparent border-2 !border-primary/40 text-foreground hover:!border-primary/60 hover:!bg-primary/5"
                : "text-primary-foreground"
            )}
            onClick={() => setShowClassicDialog(true)}
          >
            <Play className="w-5 h-5 mr-2" />
            Classic Mode
          </Button>

          <Link to="/custom" className="block">
            <Button 
              variant="outline" 
              size="lg" 
              className={cn(
                "w-full h-14 text-base font-semibold border-2 hover-lift",
                whiskersActive && showWhiskers && "!bg-transparent !border-foreground/40 text-foreground hover:!border-foreground/60 hover:!bg-foreground/5"
              )}
            >
              <Wand2 className="w-5 h-5 mr-2" />
              Custom Mode
            </Button>
          </Link>

          {/* How to Play Link */}
          <Link to="/tutorial" className="block">
            <button className={cn(
              "ghost-button w-full h-12",
              whiskersActive && showWhiskers && "!bg-transparent border-2 !border-muted-foreground/30 text-foreground hover:!border-muted-foreground/50 hover:!bg-muted/5"
            )}>
              <GraduationCap className="w-4 h-4 mr-2" />
              How to Play
            </button>
          </Link>
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-4">
          <Link to="/settings" className="flex-1">
            <button className={cn(
              "ghost-button w-full",
              whiskersActive && showWhiskers && "!bg-transparent border-2 !border-muted-foreground/30 text-foreground hover:!border-muted-foreground/50 hover:!bg-muted/5"
            )}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </Link>
          
          <Link to="/credits" className="flex-1">
            <button className={cn(
              "ghost-button w-full",
              whiskersActive && showWhiskers && "!bg-transparent border-2 !border-muted-foreground/30 text-foreground hover:!border-muted-foreground/50 hover:!bg-muted/5"
            )}>
              <Heart className="w-4 h-4 mr-2" />
              Credits
            </button>
          </Link>
        </div>

        {/* Whiskers Toggle */}
        {whiskersActive && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowWhiskers(!showWhiskers)}
              className={cn(
                "ghost-button text-xs px-3 py-1.5",
                showWhiskers && "!bg-transparent border-2 !border-muted-foreground/30 text-foreground hover:!border-muted-foreground/50 hover:!bg-muted/5"
              )}
            >
              {showWhiskers ? 'Hide' : 'Show'} Whiskers
            </button>
          </div>
        )}

        {/* Footer */}
        
      </div>

      {/* Classic Mode Dialog */}
      <ClassicModeDialog
        open={showClassicDialog}
        onOpenChange={setShowClassicDialog}
        hasSave={hasSave}
        saveDetails={saveDetails}
        onNewRun={handleNewRun}
      />
    </div>;
}