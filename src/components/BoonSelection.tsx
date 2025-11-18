import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Boon } from '@/lib/game/boons';
import { Sparkles } from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoonSelectionProps {
  precisionBoon: Boon;
  efficiencyBoon: Boon;
  adaptabilityBoon: Boon;
  onConfirm: (selectedBoonId: string) => void;
  onSkip: () => void;
  chapterName: string;
}

export function BoonSelection({
  precisionBoon,
  efficiencyBoon,
  adaptabilityBoon,
  onConfirm,
  onSkip,
  chapterName,
}: BoonSelectionProps) {
  const [selectedBoon, setSelectedBoon] = useState<string | null>(null);

  const archetypes = [
    {
      name: 'Precision',
      color: 'hsl(217, 91%, 60%)',
      icon: '🎯',
      description: 'Accuracy & Range',
      boon: precisionBoon,
    },
    {
      name: 'Efficiency',
      color: 'hsl(142, 71%, 45%)',
      icon: '⚡',
      description: 'Resources & Time',
      boon: efficiencyBoon,
    },
    {
      name: 'Adaptability',
      color: 'hsl(280, 65%, 60%)',
      icon: '🛡️',
      description: 'Survival & Control',
      boon: adaptabilityBoon,
    },
  ];

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="frosted-modal max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-display font-bold">Choose Your Boon</h2>
          </div>
          <p className="text-muted-foreground">
            Select one ability to aid you in {chapterName}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {archetypes.map(archetype => {
            const Icon = Icons[archetype.boon.icon as keyof typeof Icons] as React.FC<any>;
            const isSelected = selectedBoon === archetype.boon.id;

            return (
              <div key={archetype.name} className="space-y-2">
                {/* Archetype Header */}
                <div className="text-center p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="text-2xl mb-1">{archetype.icon}</div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide">
                    {archetype.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{archetype.description}</p>
                </div>

                {/* Boon Card */}
                <button
                  onClick={() => setSelectedBoon(archetype.boon.id)}
                  className={cn(
                    "relative w-full p-5 rounded-xl border-2 transition-all text-left",
                    "min-h-[180px] flex flex-col",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-lg scale-105"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                  )}
                  style={
                    isSelected
                      ? {
                          borderColor: archetype.color,
                          backgroundColor: `${archetype.color}15`,
                        }
                      : undefined
                  }
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 mb-auto">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                        isSelected ? "bg-primary/20" : "bg-muted"
                      )}
                      style={
                        isSelected
                          ? { backgroundColor: `${archetype.color}30` }
                          : undefined
                      }
                    >
                      <Icon
                        className={cn(
                          "w-6 h-6",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )}
                        style={
                          isSelected ? { color: archetype.color } : undefined
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">
                        {archetype.boon.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {archetype.boon.description}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            Skip (No Boon)
          </Button>
          <Button
            onClick={() => selectedBoon && onConfirm(selectedBoon)}
            disabled={!selectedBoon}
            className="flex-1"
          >
            Confirm Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
