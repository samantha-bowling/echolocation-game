import { useState } from 'react';
import { Position } from '@/lib/game/coords';

export type GamePhase = 'pinging' | 'placing' | 'confirming';

export function useGamePhase() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('pinging');
  const [finalGuess, setFinalGuess] = useState<Position | null>(null);

  const handlePlaceFinalGuess = () => {
    setGamePhase('placing');
  };

  const handleRepositionGuess = () => {
    setFinalGuess(null);
    setGamePhase('placing');
  };

  const handleGoBackToPinging = () => {
    setFinalGuess(null);
    setGamePhase('pinging');
  };

  const handleSetFinalGuess = (position: Position) => {
    setFinalGuess(position);
    setGamePhase('confirming');
  };

  const resetPhase = () => {
    setGamePhase('pinging');
    setFinalGuess(null);
  };

  return {
    gamePhase,
    finalGuess,
    setFinalGuess: handleSetFinalGuess,
    handlePlaceFinalGuess,
    handleRepositionGuess,
    handleGoBackToPinging,
    resetPhase,
  };
}
