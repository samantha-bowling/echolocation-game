import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, RotateCcw, BookOpen, Shield, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getDifficultyPreference, setDifficultyPreference } from '@/lib/game/chapterStats';

interface ClassicModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasSave: boolean;
  saveDetails: {
    level: number;
    chapter: number;
  } | null;
  onNewRun: () => void;
}

export function ClassicModeDialog({
  open,
  onOpenChange,
  hasSave,
  saveDetails,
  onNewRun,
}: ClassicModeDialogProps) {
  const [difficulty, setDifficulty] = useState<'normal' | 'challenge'>(getDifficultyPreference());

  const handleDifficultyChange = (newDifficulty: 'normal' | 'challenge') => {
    setDifficulty(newDifficulty);
    setDifficultyPreference(newDifficulty);
  };

  // Calculate progress (assuming 5 chapters, 10 levels each = 50 total levels)
  const totalLevels = 50;
  const currentProgress = saveDetails 
    ? ((saveDetails.chapter - 1) * 10 + saveDetails.level - 1) / totalLevels * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Classic Mode</DialogTitle>
          <DialogDescription>
            Choose your difficulty and how you want to play
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Difficulty Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Difficulty</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDifficultyChange('normal')}
                className={`flat-card p-4 transition-all ${
                  difficulty === 'normal'
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'hover:border-border/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <Shield className="w-6 h-6 text-blue-400" />
                  <span className="font-semibold">Normal</span>
                  <span className="text-xs text-muted-foreground">
                    Accuracy-focused
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => handleDifficultyChange('challenge')}
                className={`flat-card p-4 transition-all ${
                  difficulty === 'challenge'
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : 'hover:border-border/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <span className="font-semibold">Challenge</span>
                  <span className="text-xs text-muted-foreground">
                    Speed & precision
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Difficulty Description */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            {difficulty === 'normal' ? (
              <>
                <p className="text-sm font-medium mb-1">Normal Mode</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Focus on accuracy without time pressure</li>
                  <li>• Timer displayed for reference only</li>
                  <li>• No boons available</li>
                  <li>• B rank required to progress (600+ points)</li>
                </ul>
              </>
            ) : (
              <>
                <p className="text-sm font-medium mb-1">Challenge Mode</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Time affects your score</li>
                  <li>• Unlock and use boons for strategic advantages</li>
                  <li>• Higher scoring potential</li>
                  <li>• B rank required to progress (500+ points)</li>
                </ul>
              </>
            )}
          </div>

          {/* Continue Option (only if save exists) */}
          {hasSave && saveDetails && (
            <Link to="/classic" className="block" onClick={() => onOpenChange(false)}>
              <div className="flat-card hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Play className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-lg">Continue Your Run</h3>
                      <p className="text-sm text-muted-foreground">
                        Chapter {saveDetails.chapter} • Level {saveDetails.level}
                      </p>
                    </div>
                    <Progress value={currentProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(currentProgress)}% Complete
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* New Run Option */}
          <Link 
            to="/classic" 
            className="block" 
            onClick={() => {
              onNewRun();
              onOpenChange(false);
            }}
          >
            <div className="flat-card hover:border-accent/50 transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                  <RotateCcw className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Start New Run</h3>
                  <p className="text-sm text-muted-foreground">
                    Begin from Chapter 1, Level 1
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Chapter Select Option */}
          <Link to="/chapters" className="block" onClick={() => onOpenChange(false)}>
            <div className="flat-card hover:border-secondary/50 transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors">
                  <BookOpen className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Chapter Select</h3>
                  <p className="text-sm text-muted-foreground">
                    Practice any unlocked chapter
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-sm"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
