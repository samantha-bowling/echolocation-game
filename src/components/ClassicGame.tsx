import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, ArrowLeft, Lightbulb, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateBoxPosition, getBoxCenter, Position } from '@/lib/game/coords';
import { calculateDistance, calculateProximity } from '@/lib/game/distance';
import { calculateScore } from '@/lib/game/scoring';
import { getLevelConfig } from '@/lib/game/chapters';
import { audioEngine } from '@/lib/audio/engine';
import { PostRoundSummary } from './PostRoundSummary';

export function ClassicGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [chapter] = useState(1);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<'playing' | 'summary'>('playing');
  
  const [box, setBox] = useState(() => 
    generateBoxPosition({ width: 800, height: 600 }, 100)
  );
  const [pingsRemaining, setPingsRemaining] = useState(5);
  const [pingsUsed, setPingsUsed] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pingHistory, setPingHistory] = useState<Position[]>([]);
  const [gamePhase, setGamePhase] = useState<'pinging' | 'placing' | 'confirming'>('pinging');
  const [finalGuess, setFinalGuess] = useState<Position | null>(null);
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);

  const levelConfig = getLevelConfig(chapter, level);

  useEffect(() => {
    audioEngine.initialize();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState === 'summary') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickPos: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (gamePhase === 'pinging') {
      if (pingsRemaining <= 0) return;
      
      // Add to ping history
      setPingHistory(prev => [...prev, clickPos]);

      // Play ping sound
      const boxCenter = getBoxCenter(box);
      audioEngine.playPing(clickPos, boxCenter, 800);

      setPingsRemaining(prev => prev - 1);
      setPingsUsed(prev => prev + 1);
    } else if (gamePhase === 'placing') {
      // Set final guess position
      setFinalGuess(clickPos);
      setGamePhase('confirming');
    }
  };

  const handlePlaceFinalGuess = () => {
    if (pingHistory.length === 0) return;
    setGamePhase('placing');
  };

  const handleRepositionGuess = () => {
    setFinalGuess(null);
    setGamePhase('placing');
  };

  const handleSubmitGuess = () => {
    if (!finalGuess) return;

    const boxCenter = getBoxCenter(box);
    const proximity = calculateProximity(finalGuess, boxCenter, 800);
    
    const score = calculateScore(
      proximity,
      pingsUsed,
      levelConfig.pings,
      elapsedTime
    );

    setScoreResult(score);

    if (proximity >= 80) {
      audioEngine.playSuccess();
    } else {
      audioEngine.playFailure();
    }

    setGameState('summary');
  };

  const handleNextLevel = () => {
    setLevel(prev => prev + 1);
    setBox(generateBoxPosition({ width: 800, height: 600 }, levelConfig.boxSize));
    setPingsRemaining(levelConfig.pings);
    setPingsUsed(0);
    setPingHistory([]);
    setFinalGuess(null);
    setGamePhase('pinging');
    setScoreResult(null);
    setGameState('playing');
    setShowHint(false);
    setStartTime(Date.now());
    setElapsedTime(0);
  };

  const handleRetry = () => {
    setBox(generateBoxPosition({ width: 800, height: 600 }, levelConfig.boxSize));
    setPingsRemaining(levelConfig.pings);
    setPingsUsed(0);
    setPingHistory([]);
    setFinalGuess(null);
    setGamePhase('pinging');
    setScoreResult(null);
    setGameState('playing');
    setShowHint(false);
    setStartTime(Date.now());
    setElapsedTime(0);
  };

  if (gameState === 'summary' && scoreResult) {
    return (
      <PostRoundSummary
        score={scoreResult}
        proximity={calculateProximity(finalGuess!, getBoxCenter(box), 800)}
        pingsUsed={pingsUsed}
        timeElapsed={elapsedTime}
        onNext={handleNextLevel}
        onRetry={handleRetry}
        onMenu={() => navigate('/')}
      />
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  const getTimeColor = () => {
    if (elapsedTime < 30) return 'text-green-500';
    if (elapsedTime < 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="hover-lift"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Menu
          </Button>

          <div className="text-center">
            <p className="text-tiny text-muted-foreground">Chapter {chapter}</p>
            <p className="text-heading-3">Level {level}</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="hover-lift"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="space-y-6 w-full max-w-4xl">
          {/* Stats */}
          <div className="flat-card flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-tiny text-muted-foreground">Pings Left</p>
                <p className="text-heading-2 font-mono">{pingsRemaining}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-tiny text-muted-foreground">Time</p>
                <p className={`text-heading-3 font-mono ${getTimeColor()}`}>
                  {formatTime(elapsedTime)}
                </p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-tiny text-muted-foreground">Box Size</p>
                  <p className="text-heading-3 font-mono">{levelConfig.boxSize}px</p>
                </div>
                <div 
                  className="border-2 border-primary/30 bg-primary/5"
                  style={{ 
                    width: `${levelConfig.boxSize / 4}px`, 
                    height: `${levelConfig.boxSize / 4}px` 
                  }}
                  title={`Visual reference: ${levelConfig.boxSize}px box`}
                />
              </div>
            </div>

            {pingsUsed >= 3 && !showHint && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(true)}
                className="hover-lift"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Hint
              </Button>
            )}
          </div>

          {/* Canvas */}
          <div 
            ref={canvasRef}
            onClick={handleCanvasClick}
            className={`flat-card relative overflow-hidden ${
              gamePhase === 'placing' ? 'cursor-crosshair' : 'cursor-pointer'
            }`}
            style={{ height: '500px' }}
          >
            <div className="absolute inset-0 echo-grid opacity-30" />
            
            {/* Ping history markers */}
            {pingHistory.map((ping, index) => (
              <div
                key={index}
                className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-primary/60 border border-primary flex items-center justify-center"
                style={{
                  left: ping.x,
                  top: ping.y,
                  opacity: 0.4 + (index / pingHistory.length) * 0.6,
                }}
              >
                <span className="text-[8px] font-mono text-white font-bold">
                  {index + 1}
                </span>
              </div>
            ))}

            {/* Connecting lines between pings */}
            {pingHistory.length > 1 && (
              <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                {pingHistory.slice(0, -1).map((ping, index) => {
                  const nextPing = pingHistory[index + 1];
                  return (
                    <line
                      key={index}
                      x1={ping.x}
                      y1={ping.y}
                      x2={nextPing.x}
                      y2={nextPing.y}
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeOpacity="0.3"
                      strokeDasharray="2,2"
                    />
                  );
                })}
              </svg>
            )}

            {/* Final guess marker */}
            {finalGuess && (
              <div
                className="absolute w-8 h-8 -ml-4 -mt-4"
                style={{
                  left: finalGuess.x,
                  top: finalGuess.y,
                }}
              >
                <div className="absolute inset-0 rounded-full bg-accent animate-ping" />
                <div className="absolute inset-0 rounded-full bg-accent border-2 border-accent-foreground flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                </div>
              </div>
            )}

            {/* Center instruction */}
            {pingHistory.length === 0 && gamePhase === 'pinging' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-2 opacity-50">
                  <Radio className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-small text-muted-foreground">
                    Click to ping
                  </p>
                </div>
              </div>
            )}

            {/* Placement mode instruction */}
            {gamePhase === 'placing' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-2 bg-background/90 p-4 rounded-lg border border-border">
                  <p className="text-small font-semibold text-foreground">
                    Click to place your final guess
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {gamePhase === 'pinging' && (
              <Button
                onClick={handlePlaceFinalGuess}
                disabled={pingHistory.length === 0}
                className="flex-1 h-12"
              >
                Place Final Guess
              </Button>
            )}
            {gamePhase === 'placing' && (
              <Button
                variant="outline"
                onClick={() => setGamePhase('pinging')}
                className="flex-1 h-12"
              >
                Back to Pinging
              </Button>
            )}
            {gamePhase === 'confirming' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleRepositionGuess}
                  className="flex-1 h-12"
                >
                  Reposition
                </Button>
                <Button
                  onClick={handleSubmitGuess}
                  className="flex-1 h-12"
                >
                  Confirm & Submit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
