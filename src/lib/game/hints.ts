import { Position, Target } from './coords';
import { calculateDistance } from './distance';

export interface Hint {
  type: 'directional' | 'proximity' | 'quadrant';
  message: string;
  visualCue?: {
    type: 'arrow' | 'glow' | 'grid';
    data: any;
  };
}

/**
 * Generate a hint based on guess and target
 */
export function generateHint(
  guess: Position,
  target: Target,
  bounds: { width: number; height: number }
): Hint {
  const targetCenter = {
    x: target.position.x + target.size / 2,
    y: target.position.y + target.size / 2,
  };
  
  const distance = calculateDistance(guess, targetCenter);
  const dx = targetCenter.x - guess.x;
  const dy = targetCenter.y - guess.y;
  
  // Proximity hint
  if (distance < 150) {
    return {
      type: 'proximity',
      message: 'Very close! You\'re almost there.',
      visualCue: {
        type: 'glow',
        data: { radius: 100, position: guess },
      },
    };
  }
  
  // Directional hint
  let direction = '';
  if (Math.abs(dx) > Math.abs(dy)) {
    direction = dx > 0 ? 'right' : 'left';
  } else {
    direction = dy > 0 ? 'down' : 'up';
  }
  
  return {
    type: 'directional',
    message: `Try moving ${direction}`,
    visualCue: {
      type: 'arrow',
      data: { angle: Math.atan2(dy, dx) },
    },
  };
}

/**
 * Check if hint should be available based on attempts
 */
export function shouldShowHint(pingsUsed: number, totalPings: number): boolean {
  return pingsUsed >= Math.floor(totalPings * 0.6);
}
