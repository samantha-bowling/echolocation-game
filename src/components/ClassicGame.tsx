import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateTargetPosition, getTargetCenter, Position, PhantomTarget, generatePhantomTargets } from '@/lib/game/coords';
import { calculateProximity } from '@/lib/game/distance';
import { calculateScore } from '@/lib/game/scoring';
import { getLevelConfig, getChapterFromLevel, getChapterConfig } from '@/lib/game/chapters';
import { audioEngine } from '@/lib/audio/engine';
import { PostRoundSummary } from './PostRoundSummary';
import { GameCanvas } from './GameCanvas';
import { GameStats } from './GameStats';
import { useGameTimer } from '@/hooks/useGameTimer';
import { usePingSystem } from '@/hooks/usePingSystem';
import { useGamePhase } from '@/hooks/useGamePhase';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function ClassicGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem('echo_classic_progress');
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        return progress.level || 1;
      } catch {
        return 1;
      }
    }
    return 1;
  });
  const [gameState, setGameState] = useState<'playing' | 'summary'>('playing');
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);

  const chapter = getChapterFromLevel(level);
  const levelConfig = getLevelConfig(chapter, level);
  const chapterConfig = getChapterConfig(chapter);

  const arenaSize = useMemo(() => {
    if (isMobile) {
      const vw = Math.min(window.innerWidth - 32, 600);
      const vh = Math.min(window.innerHeight - 400, vw * 0.75);
      return { width: vw, height: vh };
    }
    return { width: 800, height: 600 };
  }, [isMobile]);

  const [target, setTarget] = useState(() => 
    generateTargetPosition(arenaSize, levelConfig.targetSize)
  );
  const [targetMoveHistory, setTargetMoveHistory] = useState<Position[]>([]);
  const [phantomTargets, setPhantomTargets] = useState<PhantomTarget[]>([]);

  const { gamePhase, finalGuess, setFinalGuess, handlePlaceFinalGuess, handleRepositionGuess, resetPhase } = useGamePhase();
  const { elapsedTime, finalTime, resetTimer } = useGameTimer({ enabled: true, gamePhase });
  const { pingHistory, pingsRemaining, pingsUsed, handlePing, resetPings } = usePingSystem({
    initialPings: levelConfig.pings,
    arenaSize,
    target,
    chapterConfig,
    onTargetResize: (newSize) => {
      setTarget(prev => ({ ...prev, size: newSize }));
    },
    onTargetMove: (newTarget) => {
      setTargetMoveHistory(prev => [...prev, getTargetCenter(target)]);
      setTarget(newTarget);
    },
  });

  useEffect(() => {
    audioEngine.initialize();
  }, []);

  useEffect(() => {
    const shouldReset = localStorage.getItem('echo_reset_classic');
    if (shouldReset === 'true') {
      setLevel(1);
      localStorage.removeItem('echo_classic_progress');
      localStorage.removeItem('echo_reset_classic');
    }
  }, []);

  // Generate phantom targets when chapter requires them
  useEffect(() => {
    if (chapterConfig.specialMechanic === 'phantom_targets' || chapterConfig.specialMechanic === 'combined_challenge') {
      const phantomCount = chapterConfig.mechanicDetails?.phantomCount || 2;
      const phantoms = generatePhantomTargets(arenaSize, target, phantomCount);
      setPhantomTargets(phantoms);
    } else {
      setPhantomTargets([]);
    }
    setTargetMoveHistory([]);
  }, [level, chapterConfig.specialMechanic]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState === 'summary') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickPos: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (gamePhase === 'pinging') {
      handlePing(clickPos);
    } else if (gamePhase === 'placing') {
      setFinalGuess(clickPos);
    }
  };

  const handleSubmitGuess = () => {
    if (!finalGuess) return;
    const targetCenter = getTargetCenter(target);
    const proximity = calculateProximity(finalGuess, targetCenter, Math.max(arenaSize.width, arenaSize.height));
    const score = calculateScore(
      proximity,
      pingsUsed,
      levelConfig.pings,
      finalTime ?? elapsedTime,
      levelConfig.difficulty
    );
    setScoreResult(score);
    setGameState('summary');
  };

  const handleNextLevel = () => {
    const nextLevel = level + 1;
    const nextChapter = getChapterFromLevel(nextLevel);
    setLevel(nextLevel);
    localStorage.setItem('echo_classic_progress', JSON.stringify({ level: nextLevel, chapter: nextChapter }));
    const newLevelConfig = getLevelConfig(nextChapter, nextLevel);
    const newTarget = generateTargetPosition(arenaSize, newLevelConfig.targetSize);
    setTarget(newTarget);
    setTargetMoveHistory([]);
    resetPings();
    resetPhase();
    resetTimer();
    setShowHint(false);
    setGameState('playing');
    setScoreResult(null);
  };

  const handleRetry = () => {
    const newTarget = generateTargetPosition(arenaSize, levelConfig.targetSize);
    setTarget(newTarget);
    setTargetMoveHistory([]);
    resetPings();
    resetPhase();
    resetTimer();
    setShowHint(false);
    setGameState('playing');
    setScoreResult(null);
  };

  if (gameState === 'summary' && scoreResult) {
    const proximity = calculateProximity(finalGuess!, getTargetCenter(target), Math.max(arenaSize.width, arenaSize.height));
    return (
      <PostRoundSummary
        score={scoreResult}
        proximity={proximity}
        pingsUsed={pingsUsed}
        totalPings={levelConfig.pings}
        timeElapsed={finalTime ?? elapsedTime}
        onNext={handleNextLevel}
        onRetry={handleRetry}
        onMenu={() => navigate('/')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border p-4">
        <div className={cn("mx-auto flex items-center justify-between", isMobile ? "max-w-full" : "max-w-6xl")}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="hover-lift">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {!isMobile && 'Menu'}
          </Button>
          <div className="text-center">
            <p className="text-tiny text-muted-foreground">Chapter {chapter}</p>
            <p className={cn("font-display font-semibold", isMobile ? "text-lg" : "text-heading-3")}>Level {level}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="hover-lift">
            <SettingsIcon className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        <div className={cn("space-y-4 md:space-y-6 w-full", isMobile ? "max-w-full" : "max-w-4xl")}>
          <GameStats
            pingsRemaining={pingsRemaining}
            pingsUsed={pingsUsed}
            elapsedTime={elapsedTime}
            finalTime={finalTime}
            timerEnabled={true}
            levelInfo={{ chapter, level }}
          />

          {pingsUsed >= 3 && !showHint && gamePhase === 'pinging' && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setShowHint(true)} className="gap-2">
                <Lightbulb className="w-4 h-4" />
                Need a hint?
              </Button>
            </div>
          )}

          {showHint && pingHistory.length > 0 && (
            <div className="flat-card bg-accent/20 border-accent/50 backdrop-blur-sm animate-fade-in">
              <p className="text-small text-accent-foreground">
                {pingHistory.length < 2 ? "Try pinging in different areas to triangulate the target position." : "The target is closer to your recent pings. Keep narrowing it down!"}
              </p>
            </div>
          )}

          <GameCanvas
            arenaSize={arenaSize}
            target={target}
            pingHistory={pingHistory}
            finalGuess={finalGuess}
            gamePhase={gamePhase}
            gameState={gameState}
            showHint={false}
            currentHint={null}
            targetMoveHistory={targetMoveHistory}
            phantomTargets={phantomTargets}
            onCanvasClick={handleCanvasClick}
            canvasRef={canvasRef}
          />

          <div className="flex justify-center gap-3">
            {gamePhase === 'pinging' && (
              <Button size={isMobile ? "lg" : "default"} onClick={handlePlaceFinalGuess} disabled={pingsUsed === 0} className={cn("hover-lift", isMobile && "min-h-[48px] px-8")}>
                Place Final Guess
              </Button>
            )}
            {gamePhase === 'placing' && (
              <div className="text-center space-y-3">
                <p className="text-small text-muted-foreground">Click on the canvas to place your guess</p>
              </div>
            )}
            {gamePhase === 'confirming' && finalGuess && (
              <>
                <Button variant="outline" size={isMobile ? "lg" : "default"} onClick={handleRepositionGuess} className={isMobile ? "min-h-[48px]" : ""}>
                  Reposition
                </Button>
                <Button size={isMobile ? "lg" : "default"} onClick={handleSubmitGuess} className={cn("hover-lift", isMobile && "min-h-[48px]")}>
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
