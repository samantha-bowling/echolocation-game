import { Position } from './coords';

/**
 * Calculate Euclidean distance between two points
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate normalized distance (0-1) within bounds
 */
export function normalizedDistance(
  pos1: Position,
  pos2: Position,
  maxDistance: number
): number {
  const distance = calculateDistance(pos1, pos2);
  return Math.min(distance / maxDistance, 1);
}

/**
 * Get directional info for audio panning
 * Returns: { angle: degrees, horizontalRatio: -1 to 1, verticalRatio: -1 to 1 }
 */
export function getDirection(from: Position, to: Position) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return {
    angle,
    horizontalRatio: distance > 0 ? dx / distance : 0, // -1 (left) to 1 (right)
    verticalRatio: distance > 0 ? dy / distance : 0,   // -1 (up) to 1 (down)
    distance,
  };
}

/**
 * Calculate proximity percentage (100% = exact match, 0% = far away)
 */
export function calculateProximity(
  guess: Position,
  target: Position,
  maxDistance: number
): number {
  const distance = calculateDistance(guess, target);
  const proximity = Math.max(0, 100 - (distance / maxDistance) * 100);
  return Math.round(proximity);
}
