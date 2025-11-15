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
  const [startTime] = useState(Date.now());
  const [guessPosition, setGuessPosition] = useState<Position | null>(null);
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);

  const levelConfig = getLevelConfig(chapter, level);

  useEffect(() => {
    audioEngine.initialize();
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pingsRemaining <= 0 || gameState === 'summary') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickPos: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setGuessPosition(clickPos);

    // Play ping sound
    const boxCenter = getBoxCenter(box);
    audioEngine.playPing(clickPos, boxCenter, 800);

    setPingsRemaining(prev => prev - 1);
    setPingsUsed(prev => prev + 1);
  };

  const handleSubmitGuess = () => {
    if (!guessPosition) return;

    const boxCenter = getBoxCenter(box);
    const proximity = calculateProximity(guessPosition, boxCenter, 800);
    const timeElapsed = (Date.now() - startTime) / 1000;
    
    const score = calculateScore(
      proximity,
      pingsUsed,
      levelConfig.pings,
      timeElapsed
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
    setGuessPosition(null);
    setScoreResult(null);
    setGameState('playing');
    setShowHint(false);
  };

  const handleRetry = () => {
    setBox(generateBoxPosition({ width: 800, height: 600 }, levelConfig.boxSize));
    setPingsRemaining(levelConfig.pings);
    setPingsUsed(0);
    setGuessPosition(null);
    setScoreResult(null);
    setGameState('playing');
    setShowHint(false);
  };

  if (gameState === 'summary' && scoreResult) {
    return (
      <PostRoundSummary
        score={scoreResult}
        proximity={calculateProximity(guessPosition!, getBoxCenter(box), 800)}
        pingsUsed={pingsUsed}
        timeElapsed={(Date.now() - startTime) / 1000}
        onNext={handleNextLevel}
        onRetry={handleRetry}
        onMenu={() => navigate('/')}
      />
    );
  }

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
                <p className="text-tiny text-muted-foreground">Box Size</p>
                <p className="text-heading-3 font-mono">{levelConfig.boxSize}px</p>
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
            className="flat-card relative overflow-hidden cursor-crosshair"
            style={{ height: '500px' }}
          >
            <div className="absolute inset-0 echo-grid opacity-30" />
            
            {/* Guess marker */}
            {guessPosition && (
              <div
                className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-primary animate-ping-pulse"
                style={{
                  left: guessPosition.x,
                  top: guessPosition.y,
                }}
              />
            )}

            {/* Center instruction */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-2 opacity-50">
                <Radio className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-small text-muted-foreground">
                  Click to ping
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleSubmitGuess}
              disabled={!guessPosition || pingsRemaining === levelConfig.pings}
              className="flex-1 h-12"
            >
              Submit Guess
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
