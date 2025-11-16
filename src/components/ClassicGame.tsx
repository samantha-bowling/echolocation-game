import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb } from 'lucide-react';
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
import { useHintSystem } from '@/hooks/useHintSystem';
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
  const [showSummaryModal, setShowSummaryModal] = useState(true);

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

  const { gamePhase, finalGuess, setFinalGuess, handlePlaceFinalGuess, handleRepositionGuess, handleGoBackToPinging, resetPhase } = useGamePhase();
  const { elapsedTime, finalTime, resetTimer, unfreezeTimer } = useGameTimer({ enabled: true, gamePhase });
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

  const { currentHint } = useHintSystem({
    enabled: showHint,
    pingsUsed,
    totalPings: levelConfig.pings,
    target,
    pingHistory,
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
    if (!seenIntros.includes(chapter) && gamePhase === 'pinging' && gameState === 'playing') {
      setShowChapterIntro(true);
    }
  }, [chapter, gamePhase, gameState]);

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

    if (gamePhase === 'pinging') {
      handlePing({ x, y });
      if (pingsRemaining === 1) {
        // Last ping used, transition to placing phase
        setTimeout(() => handlePlaceFinalGuess(), 100);
      }
    } else if (gamePhase === 'placing') {
      setFinalGuess({ x, y });
    }
  };

  const handleSubmitGuess = () => {
    if (!finalGuess) return;

    const targetCenter = getTargetCenter(target);
    const maxDistance = Math.sqrt(arenaSize.width ** 2 + arenaSize.height ** 2);
    const distance = calculateProximity(finalGuess, targetCenter, maxDistance);
    const proximity = distance; // calculateProximity already returns 0-100
    const scoreData = calculateScore(
      proximity,
      pingsUsed,
      levelConfig.pings,
      elapsedTime,
      levelConfig.difficulty
    );

    // Update chapter stats
    updateChapterStats(chapter, level, pingsUsed, scoreData.total, elapsedTime);

    setScoreResult({
      score: scoreData,
      proximity,
      pingsUsed,
      totalPings: levelConfig.pings,
      timeElapsed: elapsedTime,
    });

    localStorage.setItem('echo_classic_progress', JSON.stringify({
      level,
      chapter,
    }));

    setGameState('summary');
  };

  const handleNextLevel = () => {
    // Check if we just completed a chapter (every 10th level)
    if (level % 10 === 0) {
      setShowChapterComplete(true);
      return;
    }

    const nextLevel = level + 1;
    const nextChapter = getChapterFromLevel(nextLevel);
    
    // Check if we're entering a new chapter or boss level
    if (nextChapter !== chapter) {
      setChapterTransition(`Entering Chapter ${nextChapter}...`);
      setTimeout(() => setChapterTransition(null), 2000);
    } else if (nextLevel % 10 === 0) {
      setChapterTransition(`⚠️ BOSS LEVEL ${nextLevel} ⚠️`);
      setTimeout(() => setChapterTransition(null), 2000);
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

    resetPings();
    resetTimer();
    resetPhase();
    setGameState('playing');
    setScoreResult(null);
    setShowSummaryModal(true);

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

    resetPings();
    resetTimer();
    resetPhase();
    setGameState('playing');
    setScoreResult(null);
    setShowSummaryModal(true);
  };

  const handleContinueAfterChapterComplete = () => {
    setShowChapterComplete(false);
    handleNextLevel();
  };

  const handleRepositionGuessWithTimer = () => {
    unfreezeTimer(); // Unfreeze timer to continue counting
    handleRepositionGuess(); // Go back to placing phase
  };

  return (
    <div className="min-h-screen flex flex-col echo-dots relative">
      {/* Chapter Intro Modal */}
      {showChapterIntro && (
        <ChapterIntro
          chapter={chapterConfig}
          onClose={() => setShowChapterIntro(false)}
        />
      )}

      {/* Chapter Complete Modal */}
      {showChapterComplete && (
        <ChapterComplete
          chapter={chapterConfig}
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
            canvasRef={canvasRef}
            arenaSize={arenaSize}
            target={target}
            phantomTargets={phantomTargets}
            targetMoveHistory={targetMoveHistory}
            pingHistory={pingHistory}
            finalGuess={finalGuess}
            gamePhase={gamePhase}
            gameState={gameState}
            showHint={showHint}
            currentHint={currentHint}
            onCanvasClick={handleCanvasClick}
          />

          {/* Action Buttons */}
          {/* Early Guess Button - during pinging phase */}
          {gamePhase === 'pinging' && pingsRemaining > 0 && (
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-2">
              <Button
                variant="default"
                size="lg"
                onClick={handlePlaceFinalGuess}
                className="gap-2"
              >
                Place Final Guess
              </Button>
            </div>
          )}

          {gamePhase === 'placing' && (
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={handleGoBackToPinging}
                disabled={pingsRemaining === 0}
              >
                Back to Pinging
              </Button>
            </div>
          )}
          
          {gamePhase === 'confirming' && (
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-2">
              <Button variant="outline" onClick={handleRepositionGuessWithTimer}>
                Reposition
              </Button>
              <Button size="lg" onClick={handleSubmitGuess}>
                Submit Guess
              </Button>
            </div>
          )}
        </div>
      </div>

        {/* View Summary Button - appears when modal is closed */}
        {gameState === 'summary' && !showSummaryModal && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 animate-bounce">
            <Button
              size="lg"
              onClick={() => setShowSummaryModal(true)}
              className="shadow-2xl bg-primary hover:bg-primary/90 border-2 border-accent"
            >
              📊 View Summary
            </Button>
          </div>
        )}

      {/* Summary Modal */}
      {gameState === 'summary' && scoreResult && showSummaryModal && (
        <PostRoundSummary
          score={scoreResult.score}
          proximity={scoreResult.proximity}
          pingsUsed={scoreResult.pingsUsed}
          totalPings={scoreResult.totalPings}
          timeElapsed={scoreResult.timeElapsed}
          onNext={handleNextLevel}
          onRetry={handleRetry}
          onMenu={() => navigate('/')}
          onClose={() => setShowSummaryModal(false)}
        />
      )}
    </div>
  );
}
