import { Link } from 'react-router-dom';
import { Play, Wand2, Settings, Heart, Headphones, GraduationCap, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { isTutorialCompleted } from '@/lib/game/tutorial';

export function MainMenu() {
  const [hasSave, setHasSave] = useState(false);
  const [saveDetails, setSaveDetails] = useState<{ level: number; chapter: number } | null>(null);
  const [tutorialCompleted, setTutorialCompleted] = useState(true);

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
          setSaveDetails({ level: progress.level, chapter: progress.chapter });
        }
      } catch {
        setHasSave(false);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 echo-dots">
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
          <Link to="/classic" className="block">
            <Button 
              size="lg" 
              className="w-full h-14 text-base font-semibold hover-lift"
            >
              <Play className="w-5 h-5 mr-2" />
              {hasSave ? (
                <div className="flex flex-col items-center gap-1">
                  <span>Continue Classic</span>
                  {saveDetails && (
                    <span className="text-xs bg-white/20 px-3 py-0.5 rounded-full font-medium">
                      Chapter {saveDetails.chapter} • Level {saveDetails.level}
                    </span>
                  )}
                </div>
              ) : (
                'Start Classic'
              )}
            </Button>
          </Link>

          <Link to="/classic" className="block">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-base font-semibold border-2 hover-lift"
              onClick={() => {
                localStorage.setItem('echo_reset_classic', 'true');
              }}
            >
              <Play className="w-5 h-5 mr-2" />
              New Classic Run
            </Button>
          </Link>

          <Link to="/chapters" className="block">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full h-14 text-base font-semibold border-2 hover-lift"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Chapter Select
            </Button>
          </Link>

          <Link to="/custom" className="block">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full h-14 text-base font-semibold border-2 hover-lift"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              Custom Mode
            </Button>
          </Link>

          {/* Tutorial Link */}
          {!tutorialCompleted && (
            <Link to="/tutorial" className="block">
              <button className="ghost-button w-full h-12">
                <GraduationCap className="w-4 h-4 mr-2" />
                Start Tutorial
              </button>
            </Link>
          )}
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
        <p className="text-center text-tiny text-muted-foreground">
          v1.0.0 • Built with Lovable
        </p>
      </div>
    </div>
  );
}
