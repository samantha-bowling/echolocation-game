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
import { ChapterIntro } from './ChapterIntro';
import { ChapterComplete } from './ChapterComplete';
import { GameCanvas } from './GameCanvas';
import { GameStats } from './GameStats';
import { useGameTimer } from '@/hooks/useGameTimer';
import { usePingSystem } from '@/hooks/usePingSystem';
import { useGamePhase } from '@/hooks/useGamePhase';
import { useIsMobile } from '@/hooks/use-mobile';
import { updateChapterStats, loadChapterStats, getSeenChapterIntros } from '@/lib/game/chapterStats';
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
  const [showChapterIntro, setShowChapterIntro] = useState(false);
  const [showChapterComplete, setShowChapterComplete] = useState(false);
  const [chapterTransition, setChapterTransition] = useState<string | null>(null);
  const [currentChapterForIntro, setCurrentChapterForIntro] = useState<number | null>(null);

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

  // Check if we should show chapter intro
  useEffect(() => {
    const seenIntros = getSeenChapterIntros();
    if (!seenIntros.includes(chapter) && gamePhase === 'ready') {
      setCurrentChapterForIntro(chapter);
      setShowChapterIntro(true);
    }
  }, [chapter, gamePhase]);

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

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (gamePhase === 'playing') {
      handlePing({ x, y });
    } else if (gamePhase === 'guessing') {
      if (finalGuess) {
        handleRepositionGuess({ x, y });
      } else {
        handlePlaceFinalGuess({ x, y });
      }
    } else if (gamePhase === 'ready') {
      resetPhase();
    }
  };

  const handleFinalGuessSubmit = () => {
    if (!finalGuess) return;

    const targetCenter = getTargetCenter(target);
    const distance = calculateProximity(finalGuess, targetCenter);
    const timeUsed = elapsedTime;
    const score = calculateScore(distance, pingsUsed, timeUsed, levelConfig.targetSize);

    // Update chapter stats
    updateChapterStats(chapter, level, pingsUsed, score, timeUsed);

    const result = distance <= target.size / 2 ? 'success' : 'failure';

    setScoreResult({
      result,
      score,
      distance,
      pingsUsed,
      timeElapsed: timeUsed,
    });

    localStorage.setItem('echo_classic_progress', JSON.stringify({
      level,
      chapter,
    }));

    setGameState('summary');
  };

  const handleNextLevel = () => {
    const nextLevel = level + 1;
    const nextChapter = getChapterFromLevel(nextLevel);
    
    // Check if we just completed a chapter (every 10th level)
    const isChapterComplete = level % 10 === 0;
    
    if (isChapterComplete) {
      const chapterStats = loadChapterStats();
      const completedChapterStats = chapterStats[chapter];
      setShowChapterComplete(true);
      return;
    }
    
    // Check if we're entering a new chapter
    if (nextChapter !== chapter) {
      setChapterTransition(`Entering Chapter ${nextChapter}...`);
      setTimeout(() => {
        setChapterTransition(null);
      }, 2000);
    }
    
    // Check if this is a boss level
    if (nextLevel % 10 === 0) {
      setChapterTransition(`⚠️ BOSS LEVEL ${nextLevel} ⚠️`);
      setTimeout(() => {
        setChapterTransition(null);
      }, 2000);
    }

    setLevel(nextLevel);
    const newLevelConfig = getLevelConfig(nextChapter, nextLevel);
    const newTarget = generateTargetPosition(arenaSize, newLevelConfig.targetSize);
    setTarget(newTarget);
    setTargetMoveHistory([]);
    
    const newChapterConfig = getChapterConfig(nextChapter);
    if (newChapterConfig.specialMechanic === 'phantom_targets' || newChapterConfig.specialMechanic === 'combined_challenge') {
      const phantomCount = newChapterConfig.mechanicDetails?.phantomCount || 2;
      const phantoms = generatePhantomTargets(arenaSize, newTarget, phantomCount);
      setPhantomTargets(phantoms);
    } else {
      setPhantomTargets([]);
    }

    resetPings(newLevelConfig.pings);
    resetTimer();
    resetPhase();
    setGameState('playing');
    setScoreResult(null);
    setFinalGuess(null);

    localStorage.setItem('echo_classic_progress', JSON.stringify({
      level: nextLevel,
      chapter: nextChapter,
    }));
  };

  const handleRetry = () => {
    const newTarget = generateTargetPosition(arenaSize, levelConfig.targetSize);
    setTarget(newTarget);
    setTargetMoveHistory([]);
    
    if (chapterConfig.specialMechanic === 'phantom_targets' || chapterConfig.specialMechanic === 'combined_challenge') {
      const phantomCount = chapterConfig.mechanicDetails?.phantomCount || 2;
      const phantoms = generatePhantomTargets(arenaSize, newTarget, phantomCount);
      setPhantomTargets(phantoms);
    } else {
      setPhantomTargets([]);
    }

    resetPings(levelConfig.pings);
    resetTimer();
    resetPhase();
    setGameState('playing');
    setScoreResult(null);
    setFinalGuess(null);
  };

  const handleContinueAfterChapterComplete = () => {
    setShowChapterComplete(false);
    const nextLevel = level + 1;
    const nextChapter = getChapterFromLevel(nextLevel);
    
    setLevel(nextLevel);
    const newLevelConfig = getLevelConfig(nextChapter, nextLevel);
    const newTarget = generateTargetPosition(arenaSize, newLevelConfig.targetSize);
    setTarget(newTarget);
    setTargetMoveHistory([]);
    
    const newChapterConfig = getChapterConfig(nextChapter);
    if (newChapterConfig.specialMechanic === 'phantom_targets' || newChapterConfig.specialMechanic === 'combined_challenge') {
      const phantomCount = newChapterConfig.mechanicDetails?.phantomCount || 2;
      const phantoms = generatePhantomTargets(arenaSize, newTarget, phantomCount);
      setPhantomTargets(phantoms);
    } else {
      setPhantomTargets([]);
    }

    resetPings(newLevelConfig.pings);
    resetTimer();
    resetPhase();
    setGameState('playing');
    setScoreResult(null);
    setFinalGuess(null);

    localStorage.setItem('echo_classic_progress', JSON.stringify({
      level: nextLevel,
      chapter: nextChapter,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col echo-dots relative">
      {/* Chapter Intro Modal */}
      {showChapterIntro && currentChapterForIntro !== null && (
        <ChapterIntro
          chapter={getChapterConfig(currentChapterForIntro)}
          onClose={() => setShowChapterIntro(false)}
        />
      )}

      {/* Chapter Complete Modal */}
      {showChapterComplete && (
        <ChapterComplete
          chapter={getChapterConfig(chapter)}
          stats={loadChapterStats()[chapter]}
          onContinue={handleContinueAfterChapterComplete}
          onMainMenu={() => navigate('/')}
        />
      )}

      {/* Chapter Transition Overlay */}
      {chapterTransition && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="text-5xl font-display font-bold text-primary animate-pulse">
            {chapterTransition}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full p-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {!isMobile && 'Menu'}
        </Button>

        <GameStats
          pingsRemaining={pingsRemaining}
          pingsUsed={pingsUsed}
          elapsedTime={elapsedTime}
          finalTime={finalTime}
          timerEnabled={true}
          levelInfo={{ chapter, level }}
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHint(!showHint)}
          className="gap-2"
        >
          <Lightbulb className={cn('w-4 h-4', showHint && 'text-accent')} />
          {!isMobile && 'Hint'}
        </Button>
      </div>

      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <GameCanvas
            ref={canvasRef}
            arenaSize={arenaSize}
            target={target}
            phantomTargets={phantomTargets}
            targetMoveHistory={targetMoveHistory}
            pingHistory={pingHistory}
            finalGuess={finalGuess}
            gamePhase={gamePhase}
            showHint={showHint}
            onClick={handleCanvasClick}
          />

          {gamePhase === 'guessing' && (
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center">
              <Button
                size="lg"
                onClick={handleFinalGuessSubmit}
                disabled={!finalGuess}
                className="gap-2"
              >
                Submit Final Guess
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Modal */}
      {gameState === 'summary' && scoreResult && (
        <PostRoundSummary
          result={scoreResult.result}
          score={scoreResult.score}
          distance={scoreResult.distance}
          pingsUsed={scoreResult.pingsUsed}
          timeElapsed={scoreResult.timeElapsed}
          onNextLevel={handleNextLevel}
          onRetry={handleRetry}
          levelInfo={{ chapter, level }}
        />
      )}
    </div>
  );
}
