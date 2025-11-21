import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Boon, getBoonsByArchetype } from '@/lib/game/boons';
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
  showAllBoons?: boolean;
  unlockedBoons?: Boon[];
  context?: 'chapter-complete' | 'mid-game-swap';
  currentActiveBoon?: string;
}

export function BoonSelection({
  precisionBoon,
  efficiencyBoon,
  adaptabilityBoon,
  onConfirm,
  onSkip,
  chapterName,
  showAllBoons = false,
  unlockedBoons = [],
  context = 'chapter-complete',
  currentActiveBoon,
}: BoonSelectionProps) {
  const [selectedBoon, setSelectedBoon] = useState<string | null>(null);

  // Prepare boons to display based on mode
  const displayBoons = showAllBoons && unlockedBoons.length > 0
    ? {
        precision: unlockedBoons.filter(b => 
          getBoonsByArchetype('precision').map(ab => ab.id).includes(b.id)
        ),
        efficiency: unlockedBoons.filter(b => 
          getBoonsByArchetype('efficiency').map(ab => ab.id).includes(b.id)
        ),
        adaptability: unlockedBoons.filter(b => 
          getBoonsByArchetype('adaptability').map(ab => ab.id).includes(b.id)
        ),
      }
    : {
        precision: [precisionBoon],
        efficiency: [efficiencyBoon],
        adaptability: [adaptabilityBoon],
      };

  const archetypes = [
    {
      name: 'Precision',
      color: 'hsl(217, 91%, 60%)',
      icon: '🎯',
      description: 'Accuracy & Range',
      boons: displayBoons.precision,
    },
    {
      name: 'Efficiency',
      color: 'hsl(142, 71%, 45%)',
      icon: '⚡',
      description: 'Resources & Time',
      boons: displayBoons.efficiency,
    },
    {
      name: 'Adaptability',
      color: 'hsl(280, 65%, 60%)',
      icon: '🛡️',
      description: 'Survival & Control',
      boons: displayBoons.adaptability,
    },
  ];

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="frosted-modal max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-display font-bold">
              {context === 'mid-game-swap' ? 'Swap Your Boon' : 'Choose Your Boon'}
            </h2>
          </div>
          <p className="text-muted-foreground">
            {context === 'mid-game-swap' 
              ? 'Select a new ability or close to keep your current setup'
              : `Select one ability to aid you in ${chapterName}`
            }
          </p>
        </div>

        {showAllBoons ? (
          // TABBED INTERFACE FOR ALL BOONS
          <Tabs defaultValue="precision" className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              {archetypes.map(archetype => (
                <TabsTrigger key={archetype.name} value={archetype.name.toLowerCase()}>
                  <span className="mr-2">{archetype.icon}</span>
                  {archetype.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {archetypes.map(archetype => (
              <TabsContent key={archetype.name} value={archetype.name.toLowerCase()}>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {archetype.boons.map(boon => {
                      const Icon = Icons[boon.icon as keyof typeof Icons] as React.FC<any>;
                      const isSelected = selectedBoon === boon.id;
                      const isCurrentlyActive = currentActiveBoon === boon.id;

                      return (
                        <button
                          key={boon.id}
                          onClick={() => setSelectedBoon(boon.id)}
                          className={cn(
                            "relative w-full p-4 rounded-xl border-2 transition-all text-left",
                            "flex items-start gap-3",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-lg"
                              : "border-border bg-card hover:border-primary/50 hover:bg-muted/50",
                            isCurrentlyActive && "ring-2 ring-offset-2 ring-primary/50"
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
                          {/* Active Badge */}
                          {isCurrentlyActive && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary/20 rounded-full">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                                Active
                              </span>
                            </div>
                          )}
                          
                          {/* Selection Indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Sparkles className="w-3 h-3 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                          
                          {/* Icon */}
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
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-1">
                            <h3 className="font-semibold text-base mb-1">
                              {boon.name}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {boon.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          // ORIGINAL 3-COLUMN GRID FOR NORMAL MODE
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {archetypes.map(archetype => {
              const boon = archetype.boons[0];
              const Icon = Icons[boon.icon as keyof typeof Icons] as React.FC<any>;
              const isSelected = selectedBoon === boon.id;

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
                    onClick={() => setSelectedBoon(boon.id)}
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
                          {boon.name}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {boon.description}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            {context === 'mid-game-swap' 
              ? 'Close (Keep Current)' 
              : 'Skip (No Boon)'
            }
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
