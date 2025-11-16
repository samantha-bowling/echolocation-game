export interface Position {
  x: number;
  y: number;
}

export interface Target {
  position: Position;
  size: number; // diameter of the circle
}

export interface GameBounds {
  width: number;
  height: number;
}

export interface PhantomTarget extends Target {
  id: string;
  isReal: false;
}

/**
 * Generate a random hidden target position within bounds
 */
export function generateTargetPosition(
  bounds: GameBounds,
  targetSize: number,
  margin: number = 50
): Target {
  const maxX = bounds.width - targetSize - margin;
  const maxY = bounds.height - targetSize - margin;
  
  return {
    position: {
      x: margin + Math.random() * maxX,
      y: margin + Math.random() * maxY,
    },
    size: targetSize,
  };
}

/**
 * Check if a guess position is within the target (circular bounds)
 */
export function isWithinTarget(guess: Position, target: Target): boolean {
  const center = getTargetCenter(target);
  const dx = guess.x - center.x;
  const dy = guess.y - center.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const radius = target.size / 2;
  return distance <= radius;
}

/**
 * Get the center point of a target
 */
export function getTargetCenter(target: Target): Position {
  return {
    x: target.position.x + target.size / 2,
    y: target.position.y + target.size / 2,
  };
}

/**
 * Generate phantom targets that don't overlap with the real target
 */
export function generatePhantomTargets(
  bounds: GameBounds,
  realTarget: Target,
  count: number,
  minDistance: number = 150
): PhantomTarget[] {
  const phantoms: PhantomTarget[] = [];
  const realCenter = getTargetCenter(realTarget);
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let phantom: PhantomTarget | null = null;
    
    while (attempts < 50 && !phantom) {
      const candidate = generateTargetPosition(bounds, realTarget.size);
      const candidateCenter = getTargetCenter(candidate);
      
      // Check distance from real target
      const dx = candidateCenter.x - realCenter.x;
      const dy = candidateCenter.y - realCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check distance from other phantoms
      const tooCloseToOthers = phantoms.some(p => {
        const pCenter = getTargetCenter(p);
        const pdx = candidateCenter.x - pCenter.x;
        const pdy = candidateCenter.y - pCenter.y;
        return Math.sqrt(pdx * pdx + pdy * pdy) < minDistance;
      });
      
      if (distance >= minDistance && !tooCloseToOthers) {
        phantom = {
          ...candidate,
          id: `phantom-${i}`,
          isReal: false,
        };
      }
      
      attempts++;
    }
    
    if (phantom) {
      phantoms.push(phantom);
    }
  }
  
  return phantoms;
}
