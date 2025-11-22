import { Link } from 'react-router-dom';
import { Play, Wand2, Settings, Heart, Headphones, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { isTutorialCompleted } from '@/lib/game/tutorial';
import { ClassicModeDialog } from '@/components/ClassicModeDialog';
export function MainMenu() {
  const [hasSave, setHasSave] = useState(false);
  const [saveDetails, setSaveDetails] = useState<{
    level: number;
    chapter: number;
  } | null>(null);
  const [tutorialCompleted, setTutorialCompleted] = useState(true);
  const [showClassicDialog, setShowClassicDialog] = useState(false);

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
  }, []);
  return <div className="min-h-screen flex flex-col items-center justify-center p-6 echo-dots">
      <div className="max-w-2xl w-full space-y-12 animate-fade-in">
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
        <div className="flat-card bg-accent/30 border-accent/30 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-3 text-accent-foreground">
            <Headphones className="w-5 h-5 text-accent" />
            <p className="text-small font-medium">Headphones recommended for best experience</p>
          </div>
        </div>


        {/* Main Actions */}
        <div className="space-y-8">
          <Button 
            size="lg" 
            className="w-full h-14 text-base font-semibold hover-lift"
            onClick={() => setShowClassicDialog(true)}
          >
            <Play className="w-5 h-5 mr-2" />
            Classic Mode
          </Button>

          <Link to="/custom" className="block">
            <Button variant="outline" size="lg" className="w-full h-14 text-base font-semibold border-2 hover-lift">
              <Wand2 className="w-5 h-5 mr-2" />
              Custom Mode
            </Button>
          </Link>

          {/* How to Play Link */}
          <Link to="/tutorial" className="block">
            <button className="ghost-button w-full h-12">
              <GraduationCap className="w-4 h-4 mr-2" />
              How to Play
            </button>
          </Link>
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-4">
          <Link to="/settings" className="flex-1">
            <button className="ghost-button w-full">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </Link>
          
          <Link to="/credits" className="flex-1">
            <button className="ghost-button w-full">
              <Heart className="w-4 h-4 mr-2" />
              Credits
            </button>
          </Link>
        </div>

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