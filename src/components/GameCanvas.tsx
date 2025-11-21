import { useState, useEffect } from 'react';
import { Position, Target, getTargetCenter, PhantomTarget } from '@/lib/game/coords';
import { Hint } from '@/lib/game/hints';
import { GamePhase } from '@/hooks/useGamePhase';
import { StoredPing } from '@/hooks/usePingSystem';
import { ArrowRight, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isCheatActive } from '@/lib/game/cheats';

export interface GameCanvasProps {
  arenaSize: { width: number; height: number };
  target: Target;
  pingHistory: StoredPing[];
  finalGuess: Position | null;
  gamePhase: GamePhase;
  gameState: string;
  showHint: boolean;
  currentHint: Hint | null;
  targetMoveCount?: number;
  targetMoveHistory?: Position[];
  phantomTargets?: PhantomTarget[];
  showTargetMovementIndicator?: boolean;
  showPingLocations?: boolean;
  onCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onPingReplay?: (pingIndex: number) => void;
  replaysRemaining?: number;
  replaysUsed?: number;
  canvasRef: React.RefObject<HTMLDivElement>;
  chapter?: number; // Classic mode chapter (undefined for Custom/Tutorial)
}

export function GameCanvas({
  arenaSize,
  target,
  pingHistory,
  finalGuess,
  gamePhase,
  gameState,
  showHint,
  currentHint,
  targetMoveCount = 0,
  targetMoveHistory = [],
  phantomTargets = [],
  showTargetMovementIndicator = false,
  showPingLocations = true,
  onCanvasClick,
  onPingReplay,
  replaysRemaining,
  replaysUsed,
  canvasRef,
  chapter,
}: GameCanvasProps) {
  const targetCenter = getTargetCenter(target);
  const [showRevealHint, setShowRevealHint] = useState(false);

  // Random blink effect for REVEAL_TARGET cheat (only Chapters 2-3)
  useEffect(() => {
    const isChapters2or3 = chapter === 2 || chapter === 3;
    if (!isCheatActive('REVEAL_TARGET') || !isChapters2or3 || gameState === 'summary' || gameState === 'round-transition') {
      setShowRevealHint(false);
      return;
    }

    const scheduleNextBlink = () => {
      // Random interval between blinks: 3-8 seconds
      const randomDelay = 3000 + Math.random() * 5000;
      
      const blinkTimeout = setTimeout(() => {
        setShowRevealHint(true);
        
        // Hide after a quick blink (200ms)
        const hideTimeout = setTimeout(() => {
          setShowRevealHint(false);
          // Schedule the next blink
          scheduleNextBlink();
        }, 200);
        
        return () => clearTimeout(hideTimeout);
      }, randomDelay);
      
      return blinkTimeout;
    };

    const timeout = scheduleNextBlink();
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [gameState, chapter]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Hint Display */}
      {showHint && currentHint && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flat-card bg-accent/20 border-accent/50 backdrop-blur-sm max-w-xs animate-fade-in">
          <div className="flex items-center gap-2 text-accent-foreground">
            {currentHint.visualCue?.type === 'arrow' && (
              <ArrowRight 
                className="w-4 h-4 text-accent" 
                style={{ 
                  transform: `rotate(${(currentHint.visualCue.data.angle * 180 / Math.PI)}deg)` 
                }}
              />
            )}
            <p className="text-sm font-medium">{currentHint.message}</p>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      <div
        ref={canvasRef}
        onClick={onCanvasClick}
        className="relative bg-card border-2 border-border rounded-2xl shadow-lg overflow-hidden"
        style={{
          width: arenaSize.width,
          height: arenaSize.height,
          cursor: gamePhase === 'placing' ? 'crosshair' : 'pointer',
        }}
      >
        {/* Target Movement Indicator */}
        {showTargetMovementIndicator && targetMoveCount > 0 && (
          <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-muted/80 px-2 py-1 rounded">
            Target moved {targetMoveCount}x
          </div>
        )}

        {/* Motion Trails - Show target movement history */}
        {gameState === 'summary' && targetMoveHistory.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 6 3, 0 6"
                  fill="hsl(var(--muted-foreground))"
                  opacity="0.4"
                />
              </marker>
            </defs>
            {targetMoveHistory.map((pos, i) => (
              <g key={i}>
                {/* Ghost target at previous position */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={target.size / 2}
                  fill="hsl(var(--muted))"
                  opacity={0.1 + (i / targetMoveHistory.length) * 0.1}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                  strokeOpacity="0.2"
                />
                {/* Arrow to next position */}
                {i < targetMoveHistory.length && (
                  <line
                    x1={pos.x}
                    y1={pos.y}
                    x2={i === targetMoveHistory.length - 1 ? targetCenter.x : targetMoveHistory[i + 1].x}
                    y2={i === targetMoveHistory.length - 1 ? targetCenter.y : targetMoveHistory[i + 1].y}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="1.5"
                    strokeOpacity="0.3"
                    markerEnd="url(#arrowhead)"
                  />
                )}
              </g>
            ))}
          </svg>
        )}

        {/* Phantom Targets - Show during gameplay */}
        {phantomTargets.length > 0 && gameState !== 'summary' && (
          <>
            {phantomTargets.map((phantom) => (
              <div
                key={phantom.id}
                className="absolute rounded-full border-2 border-muted-foreground/20 bg-muted/10 animate-glitch"
                style={{
                  left: phantom.position.x,
                  top: phantom.position.y,
                  width: phantom.size,
                  height: phantom.size,
                }}
              />
            ))}
          </>
        )}

        {/* Phantom Targets - Show with labels in summary */}
        {phantomTargets.length > 0 && gameState === 'summary' && (
          <>
            {phantomTargets.map((phantom) => {
              const phantomCenter = getTargetCenter(phantom);
              return (
                <div key={phantom.id}>
                  <div
                    className="absolute rounded-full border-2 border-muted-foreground/30 bg-muted/20"
                    style={{
                      left: phantom.position.x,
                      top: phantom.position.y,
                      width: phantom.size,
                      height: phantom.size,
                    }}
                  />
                  <div
                    className="absolute text-xs font-semibold text-muted-foreground px-2 py-1 bg-muted/80 rounded"
                    style={{
                      left: phantomCenter.x - 25,
                      top: phantomCenter.y - 30,
                    }}
                  >
                    DECOY
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Reveal Target Cheat - Random Quick Blink */}
        {showRevealHint && (
          <div
            className="absolute rounded-full border border-accent/20 pointer-events-none transition-opacity duration-100"
            style={{
              left: target.position.x,
              top: target.position.y,
              width: target.size,
              height: target.size,
              background: 'rgba(59, 130, 246, 0.08)',
              opacity: 0.15,
            }}
          />
        )}

        {/* Ping History */}
        {showPingLocations && pingHistory.map((ping, i) => {
          const isReplayable = onPingReplay && (replaysRemaining === undefined || replaysRemaining === -1 || replaysRemaining > 0);
          const hasBeenReplayed = ping.isReplayed;
          
          return (
            <div key={i}>
              {/* Ping marker */}
              <div
                onClick={(e) => {
                  if (isReplayable && gamePhase === 'pinging') {
                    e.stopPropagation();
                    onPingReplay(i);
                  }
                }}
                className={cn(
                  "absolute w-6 h-6 rounded-full transition-all flex items-center justify-center",
                  isReplayable && gamePhase === 'pinging'
                    ? "cursor-pointer hover:scale-125 hover:border-2 hover:border-accent bg-primary/40"
                    : "bg-primary",
                  hasBeenReplayed && "ring-2 ring-accent ring-offset-1 ring-offset-background"
                )}
                style={{
                  left: ping.position.x - 12,
                  top: ping.position.y - 12,
                  opacity: 0.6 - (i / pingHistory.length) * 0.3,
                  animation: hasBeenReplayed ? 'pulse 1s ease-in-out' : 'none',
                }}
                title={isReplayable ? 'Click to replay ping' : undefined}
              >
                {isReplayable && gamePhase === 'pinging' && (
                  <Volume2 className="w-3 h-3 text-primary-foreground" />
                )}
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping-fade" />
              </div>
              {/* Connecting line to next ping */}
              {i < pingHistory.length - 1 && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                >
                  <line
                    x1={ping.position.x}
                    y1={ping.position.y}
                    x2={pingHistory[i + 1].position.x}
                    y2={pingHistory[i + 1].position.y}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    strokeDasharray="4 4"
                  />
                </svg>
              )}
            </div>
          );
        })}

        {/* Final Guess Marker */}
        {finalGuess && (
          <div
            className="absolute w-8 h-8"
            style={{
              left: finalGuess.x - 16,
              top: finalGuess.y - 16,
            }}
          >
            <div className="relative w-full h-full">
              {/* Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-destructive" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0.5 h-full bg-destructive" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-destructive animate-ping" />
            </div>
          </div>
        )}

        {/* Show target after guess is confirmed (for debugging/reveal) */}
        {(gameState === 'summary' || gameState === 'round-transition') && (
          <>
            {/* Real Target circle */}
            <div
              className="absolute rounded-full border-2 border-accent bg-accent/20"
              style={{
                left: target.position.x,
                top: target.position.y,
                width: target.size,
                height: target.size,
              }}
            />
            {/* REAL label */}
            <div
              className="absolute text-xs font-semibold text-accent px-2 py-1 bg-accent/80 rounded"
              style={{
                left: targetCenter.x - 20,
                top: targetCenter.y - 30,
              }}
            >
              REAL
            </div>
            {/* Line from guess to target */}
            {finalGuess && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              >
                <line
                  x1={finalGuess.x}
                  y1={finalGuess.y}
                  x2={targetCenter.x}
                  y2={targetCenter.y}
                  stroke="hsl(var(--accent))"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
              </svg>
            )}
          </>
        )}
      </div>
    </div>
  );
}
