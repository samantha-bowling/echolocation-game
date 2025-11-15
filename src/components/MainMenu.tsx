import { Link } from 'react-router-dom';
import { Play, Wand2, Settings, Heart, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MainMenu() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 echo-dots">
      <div className="max-w-2xl w-full space-y-12 animate-fade-in">
        {/* Logo */}
        <div className="text-center space-y-4">
          <h1 className="text-display font-display tracking-tight">
            echo<span className="text-primary">)))</span>location
          </h1>
          <p className="text-muted-foreground text-small">
            Find the hidden box using only sound
          </p>
        </div>

        {/* Headphones Banner */}
        <div className="flat-card bg-accent/10 border-accent/20">
          <div className="flex items-center gap-3 text-accent-foreground">
            <Headphones className="w-5 h-5 text-accent" />
            <p className="text-small font-medium">Headphones recommended for best experience</p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          <Link to="/classic">
            <Button 
              size="lg" 
              className="w-full h-14 text-base font-semibold hover-lift"
            >
              <Play className="w-5 h-5 mr-2" />
              Continue Classic
            </Button>
          </Link>

          <Link to="/classic">
            <button className="ghost-button w-full h-12">
              New Classic Run
            </button>
          </Link>

          <Link to="/custom">
            <button className="ghost-button w-full h-12">
              <Wand2 className="w-4 h-4 mr-2" />
              Custom Mode
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
        <p className="text-center text-tiny text-muted-foreground">
          v1.0.0 • Built with Lovable
        </p>
      </div>
    </div>
  );
}
