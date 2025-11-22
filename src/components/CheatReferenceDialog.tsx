import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAllCheats } from '@/lib/game/cheats';
import { Code2, Gamepad2, Sparkles, Bug, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CheatReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheatReferenceDialog({ open, onOpenChange }: CheatReferenceDialogProps) {
  const allCheats = getAllCheats();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Cheat code copied to clipboard!');
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };
  
  const categoryIcons = {
    progression: Sparkles,
    gameplay: Gamepad2,
    debug: Bug,
    meta: Code2,
  };
  
  const categoryColors = {
    progression: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    gameplay: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    debug: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    meta: 'bg-green-500/10 text-green-600 border-green-500/20',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-heading-2">
            <Code2 className="w-6 h-6" />
            Cheat Code Reference
          </DialogTitle>
          <DialogDescription>
            All available cheat codes for echo)))location. Enter these in the Settings page to activate them.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {allCheats.map((cheat) => {
              const Icon = categoryIcons[cheat.category];
              const colorClass = categoryColors[cheat.category];
              
              return (
                <div
                  key={cheat.code}
                  className="flat-card space-y-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-base font-semibold">{cheat.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cheat.description}
                      </p>
                    </div>
                    <Badge variant="outline" className={`shrink-0 ${colorClass}`}>
                      {cheat.category}
                    </Badge>
                  </div>
                  
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                      {cheat.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(cheat.code)}
                      className="shrink-0"
                      aria-label="Copy cheat code"
                    >
                      {copiedCode === cheat.code ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
