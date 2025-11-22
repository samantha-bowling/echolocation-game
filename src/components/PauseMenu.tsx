import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Settings, LogOut } from 'lucide-react';

interface PauseMenuProps {
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onQuit: () => void;
  currentLevel?: number;
  currentChapter?: number;
  activeBoon?: string;
}

export function PauseMenu({ 
  open, 
  onResume, 
  onRestart, 
  onSettings, 
  onQuit,
  currentLevel,
  currentChapter,
  activeBoon 
}: PauseMenuProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onResume()}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display font-bold">Game Paused</h2>
            {currentLevel && currentChapter && (
              <p className="text-muted-foreground">
                Chapter {currentChapter} • Level {currentLevel}
              </p>
            )}
            {activeBoon && (
              <p className="text-sm text-primary">Active Boon: {activeBoon}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Button 
              className="w-full" 
              size="lg"
              onClick={onResume}
            >
              <Play className="w-4 h-4 mr-2" />
              Resume Game
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={onRestart}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart Level
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={onSettings}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            
            <Button 
              className="w-full" 
              variant="destructive"
              onClick={onQuit}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Quit to Menu
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">ESC</kbd> to resume
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
