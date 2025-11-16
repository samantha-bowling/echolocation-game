import { Position, Target, getTargetCenter } from '@/lib/game/coords';
import { Hint } from '@/lib/game/hints';
import { GamePhase } from '@/hooks/useGamePhase';
import { ArrowRight } from 'lucide-react';

export interface GameCanvasProps {
  arenaSize: { width: number; height: number };
  target: Target;
  pingHistory: Position[];
  finalGuess: Position | null;
  gamePhase: GamePhase;
  gameState: string;
  showHint: boolean;
  currentHint: Hint | null;
  targetMoveCount?: number;
  showTargetMovementIndicator?: boolean;
  onCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
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
  showTargetMovementIndicator = false,
  onCanvasClick,
  canvasRef,
}: GameCanvasProps) {
  const targetCenter = getTargetCenter(target);

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

        {/* Ping History */}
        {pingHistory.map((ping, i) => (
          <div key={i}>
            {/* Ping marker */}
            <div
              className="absolute w-3 h-3 bg-primary rounded-full animate-fade-in"
              style={{
                left: ping.x - 6,
                top: ping.y - 6,
                opacity: 0.6 - (i / pingHistory.length) * 0.3,
              }}
            />
            {/* Connecting line to next ping */}
            {i < pingHistory.length - 1 && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              >
                <line
                  x1={ping.x}
                  y1={ping.y}
                  x2={pingHistory[i + 1].x}
                  y2={pingHistory[i + 1].y}
                  stroke="hsl(var(--primary))"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                  strokeDasharray="4 4"
                />
              </svg>
            )}
          </div>
        ))}

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
        {gameState === 'summary' && (
          <>
            {/* Target circle */}
            <div
              className="absolute rounded-full border-2 border-accent bg-accent/20"
              style={{
                left: target.position.x,
                top: target.position.y,
                width: target.size,
                height: target.size,
              }}
            />
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
