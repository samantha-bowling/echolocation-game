import { useState, useEffect } from 'react';
import { Position, Target } from '@/lib/game/coords';
import { generateHint, shouldShowHint, Hint } from '@/lib/game/hints';

export interface HintSystemOptions {
  enabled: boolean;
  pingsUsed: number;
  totalPings: number;
  target: Target;
  pingHistory: Position[];
}

export function useHintSystem({
  enabled,
  pingsUsed,
  totalPings,
  target,
  pingHistory,
}: HintSystemOptions) {
  const [currentHint, setCurrentHint] = useState<Hint | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Auto-generate hints when threshold is met
  useEffect(() => {
    if (!enabled || pingHistory.length === 0) return;

    if (shouldShowHint(pingsUsed, totalPings)) {
      const lastPing = pingHistory[pingHistory.length - 1];
      const hint = generateHint(lastPing, target, { width: 800, height: 600 });
      setCurrentHint(hint);
      setShowHint(true);
    }
  }, [enabled, pingsUsed, totalPings, target, pingHistory]);

  const dismissHint = () => {
    setShowHint(false);
  };

  const resetHints = () => {
    setCurrentHint(null);
    setShowHint(false);
  };

  return {
    currentHint,
    showHint,
    setShowHint,
    dismissHint,
    resetHints,
  };
}
