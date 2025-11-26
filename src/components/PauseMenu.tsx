import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Play, RotateCcw, Settings, LogOut, Save, Radio, Clock } from 'lucide-react';

interface PauseMenuProps {
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onQuit: () => void;
  onSave?: () => void;
  currentLevel?: number;
  currentChapter?: number;
  currentRound?: number;
  totalRounds?: number;
  activeBoon?: string;
  pingsUsed?: number;
  pingsRemaining?: number;
  elapsedTime?: number;
  isCustomMode?: boolean;
}

export function PauseMenu({ 
  open, 
  onResume, 
  onRestart, 
  onSettings, 
  onQuit,
  onSave,
  currentLevel,
  currentChapter,
  currentRound,
  totalRounds,
  activeBoon,
  pingsUsed,
  pingsRemaining,
  elapsedTime,
  isCustomMode = false,
}: PauseMenuProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onResume()}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display font-bold">Game Paused</h2>
            {isCustomMode && currentRound && (
              <p className="text-muted-foreground">
                Round {currentRound}{totalRounds ? ` of ${totalRounds}` : ' • Cozy Mode'}
              </p>
            )}
            {!isCustomMode && currentLevel && currentChapter && (
              <p className="text-muted-foreground">
                Chapter {currentChapter} • Level {currentLevel}
              </p>
            )}
            {activeBoon && (
              <p className="text-sm text-primary">Active Boon: {activeBoon}</p>
            )}
          </div>

          {/* Current Stats Display */}
          {(pingsUsed !== undefined || elapsedTime !== undefined) && (
            <>
              <Separator />
              <div className="grid grid-cols-3 gap-3 text-center">
                {pingsUsed !== undefined && pingsRemaining !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                      <Radio className="w-3 h-3" />
                      <span>Pings</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {pingsUsed}{pingsRemaining === Infinity ? '' : `/${pingsUsed + pingsRemaining}`}
                    </p>
                  </div>
                )}
                {elapsedTime !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                      <Clock className="w-3 h-3" />
                      <span>Time</span>
                    </div>
                    <p className="text-lg font-semibold">{formatTime(elapsedTime)}</p>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}
          
          <div className="space-y-2">
            <Button 
              className="w-full min-h-[48px]" 
              size="lg"
              onClick={onResume}
            >
              <Play className="w-4 h-4 mr-2" />
              Resume Game
            </Button>
            
            <Button 
              className="w-full min-h-[48px]" 
              variant="outline"
              onClick={onRestart}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {isCustomMode ? 'Restart Game' : 'Restart Level'}
            </Button>

            {isCustomMode && onSave && (
              <Button 
                className="w-full min-h-[48px]" 
                variant="outline"
                onClick={() => {
                  onSave();
                  onResume();
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Progress
              </Button>
            )}
            
            <Button 
              className="w-full min-h-[48px]" 
              variant="outline"
              onClick={onSettings}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            
            <Button 
              className="w-full min-h-[48px]" 
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
