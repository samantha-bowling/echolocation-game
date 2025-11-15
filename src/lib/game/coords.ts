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
