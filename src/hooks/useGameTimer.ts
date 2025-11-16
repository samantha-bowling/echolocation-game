import { useState, useEffect } from 'react';

export interface GameTimerOptions {
  enabled: boolean;
  gamePhase: string;
  onTimeFreeze?: (time: number) => void;
}

export function useGameTimer({ enabled, gamePhase, onTimeFreeze }: GameTimerOptions) {
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);

  // Timer interval management
  useEffect(() => {
    if (!enabled || finalTime !== null) return;
    
    let animationFrameId: number;
    let lastTime = performance.now();

    const updateTimer = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      if (deltaTime >= 100) { // Update every 100ms
        setElapsedTime((Date.now() - startTime) / 1000);
        lastTime = currentTime;
      }
      animationFrameId = requestAnimationFrame(updateTimer);
    };

    animationFrameId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(animationFrameId);
  }, [enabled, startTime, finalTime]);

  // Auto-freeze when gamePhase === 'confirming'
  useEffect(() => {
    if (gamePhase === 'confirming' && finalTime === null && enabled) {
      setFinalTime(elapsedTime);
      onTimeFreeze?.(elapsedTime);
    }
  }, [gamePhase, finalTime, elapsedTime, enabled, onTimeFreeze]);

  const resetTimer = () => {
    setStartTime(Date.now());
    setElapsedTime(0);
    setFinalTime(null);
  };

  return {
    elapsedTime,
    finalTime,
    resetTimer,
  };
}
