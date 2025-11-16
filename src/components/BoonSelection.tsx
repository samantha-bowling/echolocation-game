import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Boon } from '@/lib/game/boons';
import { Check, Sparkles } from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoonSelectionProps {
  availableBoons: Boon[];
  maxSelections: number;
  onConfirm: (selectedBoonIds: string[]) => void;
  onSkip: () => void;
  chapterName: string;
}

export function BoonSelection({
  availableBoons,
  maxSelections,
  onConfirm,
  onSkip,
  chapterName,
}: BoonSelectionProps) {
  const [selectedBoons, setSelectedBoons] = useState<string[]>([]);

  const toggleBoon = (boonId: string) => {
    setSelectedBoons(prev => {
      if (prev.includes(boonId)) {
        return prev.filter(id => id !== boonId);
      }
      if (prev.length >= maxSelections) {
        return [...prev.slice(1), boonId];
      }
      return [...prev, boonId];
    });
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="frosted-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-display font-bold">Choose Your Boons</h2>
          </div>
          <p className="text-muted-foreground">
            Select up to {maxSelections} boon{maxSelections > 1 ? 's' : ''} for {chapterName}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {availableBoons.map(boon => {
            const Icon = Icons[boon.icon as keyof typeof Icons] as React.FC<any>;
            const isSelected = selectedBoons.includes(boon.id);

            return (
              <button
                key={boon.id}
                onClick={() => toggleBoon(boon.id)}
                className={cn(
                  "relative p-5 rounded-xl border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-lg scale-105"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
                
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isSelected ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{boon.name}</h3>
                    <p className="text-sm text-muted-foreground">{boon.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            Skip (No Boons)
          </Button>
          <Button
            onClick={() => onConfirm(selectedBoons)}
            disabled={selectedBoons.length === 0}
            className="flex-1"
          >
            Confirm Selection {selectedBoons.length > 0 && `(${selectedBoons.length}/${maxSelections})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
