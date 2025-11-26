import { useState, useEffect } from 'react';

export interface GameTimerOptions {
  enabled: boolean;
  gamePhase: string;
  startOnFirstPing?: boolean;
  paused?: boolean;
  onTimeFreeze?: (time: number) => void;
}

export function useGameTimer({ enabled, gamePhase, startOnFirstPing = false, paused = false, onTimeFreeze }: GameTimerOptions) {
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [hasStarted, setHasStarted] = useState(!startOnFirstPing);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);

  // Handle pause state changes
  useEffect(() => {
    if (paused && !pausedAt) {
      // Pause started
      setPausedAt(Date.now());
    } else if (!paused && pausedAt) {
      // Pause ended - adjust for paused duration
      const pauseDuration = Date.now() - pausedAt;
      setTotalPausedTime(prev => prev + pauseDuration);
      setPausedAt(null);
    }
  }, [paused, pausedAt]);

  // Timer interval management
  useEffect(() => {
    if (!enabled || finalTime !== null || !hasStarted || paused) return;
    
    let animationFrameId: number;
    let lastTime = performance.now();

    const updateTimer = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      if (deltaTime >= 100) { // Update every 100ms
        setElapsedTime((Date.now() - startTime - totalPausedTime) / 1000);
        lastTime = currentTime;
      }
      animationFrameId = requestAnimationFrame(updateTimer);
    };

    animationFrameId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(animationFrameId);
  }, [enabled, startTime, finalTime, hasStarted, paused, totalPausedTime]);

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
    setPausedAt(null);
    setTotalPausedTime(0);
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
