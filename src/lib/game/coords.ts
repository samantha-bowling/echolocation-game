export interface Position {
  x: number;
  y: number;
}

export interface Box {
  position: Position;
  size: number;
}

export interface GameBounds {
  width: number;
  height: number;
}

/**
 * Generate a random hidden box position within bounds
 */
export function generateBoxPosition(
  bounds: GameBounds,
  boxSize: number,
  margin: number = 50
): Box {
  const maxX = bounds.width - boxSize - margin;
  const maxY = bounds.height - boxSize - margin;
  
  return {
    position: {
      x: margin + Math.random() * maxX,
      y: margin + Math.random() * maxY,
    },
    size: boxSize,
  };
}

/**
 * Check if a guess position is within the box bounds
 */
export function isWithinBox(guess: Position, box: Box): boolean {
  return (
    guess.x >= box.position.x &&
    guess.x <= box.position.x + box.size &&
    guess.y >= box.position.y &&
    guess.y <= box.position.y + box.size
  );
}

/**
 * Get the center point of a box
 */
export function getBoxCenter(box: Box): Position {
  return {
    x: box.position.x + box.size / 2,
    y: box.position.y + box.size / 2,
  };
}
