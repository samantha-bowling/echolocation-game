import { useState } from 'react';
import { Position, Target, getTargetCenter } from '@/lib/game/coords';
import { audioEngine } from '@/lib/audio/engine';
import { CustomGameConfig } from '@/lib/game/customConfig';

export interface PingSystemOptions {
  initialPings: number;
  arenaSize: { width: number; height: number };
  target: Target;
  config?: CustomGameConfig;
  onTargetMove?: (newTarget: Target) => void;
}

export function usePingSystem({ 
  initialPings, 
  arenaSize, 
  target, 
  config,
  onTargetMove 
}: PingSystemOptions) {
  const [pingHistory, setPingHistory] = useState<Position[]>([]);
  const [pingsRemaining, setPingsRemaining] = useState(initialPings);
  const [pingsUsed, setPingsUsed] = useState(0);

  const handlePing = (clickPos: Position) => {
    // Check ping limit (unless unlimited)
    if (config?.pingsMode === 'limited' && pingsRemaining <= 0) return false;
    if (!config && pingsRemaining <= 0) return false;

    // Add to ping history
    setPingHistory(prev => [...prev, clickPos]);

    // Play audio
    const targetCenter = getTargetCenter(target);
    const maxDistance = Math.max(arenaSize.width, arenaSize.height);
    audioEngine.playPing(clickPos, targetCenter, maxDistance);

    // Update counts
    if (!config || config.pingsMode === 'limited') {
      setPingsRemaining(prev => prev - 1);
    }
    setPingsUsed(prev => prev + 1);

    // Handle target movement if enabled
    if (config?.movementMode === 'after-pings' && onTargetMove) {
      // Move target after each ping
      const moveAmount = 30; // pixels
      const angle = Math.random() * Math.PI * 2;
      const newX = Math.max(
        50,
        Math.min(
          arenaSize.width - target.size - 50,
          target.position.x + Math.cos(angle) * moveAmount
        )
      );
      const newY = Math.max(
        50,
        Math.min(
          arenaSize.height - target.size - 50,
          target.position.y + Math.sin(angle) * moveAmount
        )
      );
      
      onTargetMove({
        ...target,
        position: { x: newX, y: newY }
      });
    }

    return true;
  };

  const resetPings = () => {
    setPingHistory([]);
    setPingsRemaining(initialPings);
    setPingsUsed(0);
  };

  return {
    pingHistory,
    pingsRemaining,
    pingsUsed,
    handlePing,
    resetPings,
  };
}
