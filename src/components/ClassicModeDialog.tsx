import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, RotateCcw, BookOpen, Shield, Zap, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
                  <li>• B rank required to progress (500+ points)</li>
                </ul>
              </>
            ) : (
              <>
                <p className="text-sm font-medium mb-1">Challenge Mode</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Time affects your score</li>
                  <li>• Unlock and use boons for strategic advantages</li>
                  <li>• Higher scoring potential</li>
                  <li>• B rank required to progress (700+ points)</li>
                </ul>
              </>
            )}
          </div>

          {/* Action Cards - 2x2 grid when save exists, else New Run full width + 2 column bottom */}
          {hasSave && saveDetails ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Continue Your Run */}
              <Link to="/classic" className="block" onClick={() => onOpenChange(false)}>
                <div className="flat-card p-3 h-full hover:border-primary/50 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Play className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">Continue</h3>
                    <p className="text-xs text-muted-foreground">
                      Ch {saveDetails.chapter} • L {saveDetails.level}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Start New Run */}
              <Link 
                to="/classic" 
                className="block" 
                onClick={() => {
                  onNewRun();
                  onOpenChange(false);
                }}
              >
                <div className="flat-card p-3 h-full hover:border-accent/50 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <RotateCcw className="w-4 h-4 text-accent" />
                    <h3 className="font-semibold text-sm">New Run</h3>
                    <p className="text-xs text-muted-foreground">Start fresh</p>
                  </div>
                </div>
              </Link>

              {/* Chapter Select */}
              <Link to="/chapters" className="block" onClick={() => onOpenChange(false)}>
                <div className="flat-card p-3 h-full hover:border-secondary/50 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <BookOpen className="w-4 h-4 text-secondary-foreground" />
                    <h3 className="font-semibold text-sm">Chapters</h3>
                    <p className="text-xs text-muted-foreground">Select chapter</p>
                  </div>
                </div>
              </Link>

              {/* View Stats */}
              <Link to="/classic-stats" className="block" onClick={() => onOpenChange(false)}>
                <div className="flat-card p-3 h-full hover:border-purple-500/50 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-sm">Stats</h3>
                    <p className="text-xs text-muted-foreground">View progress</p>
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Start New Run - Full Width */}
              <Link 
                to="/classic" 
                className="block" 
                onClick={() => {
                  onNewRun();
                  onOpenChange(false);
                }}
              >
                <div className="flat-card p-4 hover:border-accent/50 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <RotateCcw className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-base">Start New Run</h3>
                    <p className="text-sm text-muted-foreground">Begin from Chapter 1, Level 1</p>
                  </div>
                </div>
              </Link>

              {/* Bottom Row - Chapter Select + View Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Link to="/chapters" className="block" onClick={() => onOpenChange(false)}>
                  <div className="flat-card p-3 h-full hover:border-secondary/50 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <BookOpen className="w-4 h-4 text-secondary-foreground" />
                      <h3 className="font-semibold text-sm">Chapters</h3>
                      <p className="text-xs text-muted-foreground">Select chapter</p>
                    </div>
                  </div>
                </Link>

                <Link to="/classic-stats" className="block" onClick={() => onOpenChange(false)}>
                  <div className="flat-card p-3 h-full hover:border-purple-500/50 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <h3 className="font-semibold text-sm">Stats</h3>
                      <p className="text-xs text-muted-foreground">View progress</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}
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
