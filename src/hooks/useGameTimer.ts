import { useState, useEffect } from 'react';

export interface GameTimerOptions {
  enabled: boolean;
  gamePhase: string;
  startOnFirstPing?: boolean;
  onTimeFreeze?: (time: number) => void;
}

export function useGameTimer({ enabled, gamePhase, startOnFirstPing = false, onTimeFreeze }: GameTimerOptions) {
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [hasStarted, setHasStarted] = useState(!startOnFirstPing);

  // Timer interval management
  useEffect(() => {
    if (!enabled || finalTime !== null || !hasStarted) return;
    
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
  }, [enabled, startTime, finalTime, hasStarted]);

  // Auto-freeze only when gamePhase === 'confirming'
  useEffect(() => {
    if (gamePhase === 'confirming' && finalTime === null && enabled && hasStarted) {
      setFinalTime(elapsedTime);
      onTimeFreeze?.(elapsedTime);
    }
  }, [gamePhase, finalTime, elapsedTime, enabled, hasStarted, onTimeFreeze]);

  const resetTimer = () => {
    setStartTime(Date.now());
    setElapsedTime(0);
    setFinalTime(null);
    setHasStarted(!startOnFirstPing);
  };

  const unfreezeTimer = () => {
    setFinalTime(null);
  };

  const startTimer = () => {
    if (!hasStarted) {
      setStartTime(Date.now());
      setHasStarted(true);
    }
  };

  return {
    elapsedTime,
    finalTime,
    resetTimer,
    unfreezeTimer,
    startTimer,
  };
}
