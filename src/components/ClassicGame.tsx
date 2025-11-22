import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, BarChart3, Sparkles } from 'lucide-react';
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
import { BoonSelection } from './BoonSelection';
import { PauseMenu } from './PauseMenu';
import { useGameTimer } from '@/hooks/useGameTimer';
import { usePingSystem } from '@/hooks/usePingSystem';
import { useGamePhase } from '@/hooks/useGamePhase';
import { useHintSystem } from '@/hooks/useHintSystem';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { updateChapterStats, loadChapterStats, getSeenChapterIntros, saveChapterProgress, getDifficultyPreference, migrateChapterStatsToV2 } from '@/lib/game/chapterStats';
import { getUnlockedBoons, applyBoonEffects, getRandomBoonByArchetype, type Boon, getBoonById } from '@/lib/game/boons';
import { isCheatActive } from '@/lib/game/cheats';
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
  const [hintUsed, setHintUsed] = useState(false);
  const [showChapterIntro, setShowChapterIntro] = useState(false);
  const [showChapterComplete, setShowChapterComplete] = useState(false);
  const [chapterTransition, setChapterTransition] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(true);
  const [showBoonSelection, setShowBoonSelection] = useState(false);
  const [boonSelectionContext, setBoonSelectionContext] = useState<'chapter-complete' | 'mid-game-swap'>('chapter-complete');
  const [activeBoons, setActiveBoons] = useState<string[]>([]);
  const [boonChoices, setBoonChoices] = useState<{ precision: Boon; efficiency: Boon; adaptability: Boon } | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [completedChapters, setCompletedChapters] = useState<number[]>(() => {
    const stats = loadChapterStats();
    return Object.values(stats)
      .filter(s => s.levelsCompleted === 10)
      .map((_, idx) => idx + 1);
  });

  const difficulty = getDifficultyPreference();
  const canSwapBoons = difficulty === 'challenge' && isCheatActive('SWAP_BOONS');

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
  const { elapsedTime, finalTime, resetTimer, unfreezeTimer, startTimer } = useGameTimer({ 
    enabled: true, 
    gamePhase,
    startOnFirstPing: true
  });
  
  // Boons only available in Challenge mode
  const boonEffects = difficulty === 'challenge' ? applyBoonEffects(
    levelConfig.pings,
    chapterConfig.replaysAvailable,
    activeBoons
  ) : {
    pings: levelConfig.pings,
    replays: chapterConfig.replaysAvailable
  };
  
  const { pingHistory, pingsRemaining, pingsUsed, replaysRemaining, replaysUsed, handlePing, handleReplayPing, resetPings } = usePingSystem({
    initialPings: boonEffects.pings,
    arenaSize,
    target,
    chapterConfig,
    replaysAvailable: boonEffects.replays,
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

  // Run migration and initialize audio once on mount
  useEffect(() => {
    migrateChapterStatsToV2();
    audioEngine.initialize(arenaSize.width, arenaSize.height);
    
    // Load saved audio preferences
    const savedTheme = localStorage.getItem('echo_audio_theme');
    const savedVolume = localStorage.getItem('echo_volume');
    
    if (savedTheme) {
      audioEngine.setTheme(savedTheme);
    }
    if (savedVolume) {
      audioEngine.setVolume(parseInt(savedVolume) / 100);
    }

    // Cleanup on unmount
    return () => {
      audioEngine.cleanup();
    };
  }, []);

  // Update dimensions when arena size changes (without re-initializing)
  useEffect(() => {
    audioEngine.updateDimensions(arenaSize.width, arenaSize.height);
  }, [arenaSize.width, arenaSize.height]);

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
    if (!seenIntros.includes(chapter)) {
      setShowChapterIntro(true);
    } else {
      // If no intro, check for boon selection
      const unlockedBoons = getUnlockedBoons(completedChapters);
      if (chapter >= 2 && chapter <= 5 && unlockedBoons.length > 0 && activeBoons.length === 0) {
        setShowBoonSelection(true);
      }
    }
  }, [chapter, completedChapters, activeBoons]);

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
      const isFirstPing = pingsUsed === 0;
      handlePing({ x, y });
      
      // Start timer on first ping
      if (isFirstPing) {
        startTimer();
      }
      
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
    const maxDistance = Math.sqrt(arenaSize.width ** 2 + arenaSize.height ** 2) * 0.7;
    const distance = calculateProximity(finalGuess, targetCenter, maxDistance);
    const proximity = distance; // calculateProximity already returns 0-100
    const difficulty = getDifficultyPreference();
    const scoreData = calculateScore(
      proximity,
      pingsUsed,
      levelConfig.pings,
      elapsedTime,
      chapter,
      replaysUsed,
      chapterConfig.replaysAvailable,
      hintUsed,
      difficulty
    );

    // Update chapter stats with rank and difficulty
    const updatedChapterStats = updateChapterStats(chapter, level, pingsUsed, scoreData.total, elapsedTime, scoreData.rank, difficulty);

    // Check if chapter was just completed (level 10)
    const isChapterComplete = (level % 10 === 0);

    setScoreResult({
      score: scoreData,
      proximity,
      pingsUsed,
      totalPings: levelConfig.pings,
      timeElapsed: elapsedTime,
    });

    // Save global progress pointer
    localStorage.setItem('echo_classic_progress', JSON.stringify({
      level,
      chapter,
    }));
    
    // Save per-chapter progress
    saveChapterProgress(chapter, level);

    setGameState('summary');
    
    // Update completed chapters if this was the last level
    if (level % 10 === 0) {
      setCompletedChapters(prev => {
        const updated = [...new Set([...prev, chapter])];
        return updated;
      });
    }
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

    // Save global progress pointer
    localStorage.setItem('echo_classic_progress', JSON.stringify({
      level: nextLevel,
      chapter: nextChapter,
    }));
    
    // Save per-chapter progress
    saveChapterProgress(nextChapter, nextLevel);
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
    setShowHint(false);
    setHintUsed(false);
  };

  const handleContinueAfterChapterComplete = () => {
    setShowChapterComplete(false);
    setBoonSelectionContext('chapter-complete');
    
    // Show boon selection after chapters 1-4 (for next chapter)
    const nextChapter = chapter + 1;
    if (nextChapter >= 2 && nextChapter <= 5) {
      const precisionBoon = getRandomBoonByArchetype('precision', activeBoons);
      const efficiencyBoon = getRandomBoonByArchetype('efficiency', activeBoons);
      const adaptabilityBoon = getRandomBoonByArchetype('adaptability', activeBoons);
      
      setBoonChoices({ precision: precisionBoon, efficiency: efficiencyBoon, adaptability: adaptabilityBoon });
      setShowBoonSelection(true);
    } else {
      handleNextLevel();
    }
  };

  const handleBoonConfirm = (selectedBoonId: string) => {
    setActiveBoons([selectedBoonId]); // Replace with single boon
    setShowBoonSelection(false);
    
    // Only advance to next level if in chapter-complete flow
    if (boonSelectionContext === 'chapter-complete') {
      handleNextLevel();
    }
    // If mid-game-swap, just close and continue playing
  };

  const handleBoonSkip = () => {
    setActiveBoons([]);
    setShowBoonSelection(false);
    
    // Only advance to next level if in chapter-complete flow
    if (boonSelectionContext === 'chapter-complete') {
      handleNextLevel();
    }
    // If mid-game-swap, just close and continue playing
  };

  const handleRepositionGuessWithTimer = useCallback(() => {
    unfreezeTimer(); // Unfreeze timer to continue counting
    handleRepositionGuess(); // Go back to placing phase
  }, [unfreezeTimer, handleRepositionGuess]);

  const handleHintClick = useCallback(() => {
    setShowHint(prev => !prev);
    if (!showHint && !hintUsed) {
      setHintUsed(true);
    }
  }, [showHint, hintUsed]);

  const handleSwapBoonClick = useCallback(() => {
    setBoonSelectionContext('mid-game-swap');
    
    const precisionBoon = getRandomBoonByArchetype('precision', activeBoons);
    const efficiencyBoon = getRandomBoonByArchetype('efficiency', activeBoons);
    const adaptabilityBoon = getRandomBoonByArchetype('adaptability', activeBoons);
    
    setBoonChoices({ precision: precisionBoon, efficiency: efficiencyBoon, adaptability: adaptabilityBoon });
    setShowBoonSelection(true);
  }, [activeBoons]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'escape': () => {
      if (gameState === 'playing' && !showChapterIntro && !showBoonSelection && !showChapterComplete) {
        setIsPaused(prev => !prev);
      }
    },
    'r': () => {
      if (gameState === 'summary' && !isPaused) {
        handleRetry();
      }
    },
    'n': () => {
      if (gameState === 'summary' && scoreResult && !isPaused) {
        const isBossLevel = level % 10 === 0;
        const canProgress = scoreResult.score.rank === 'SS' || scoreResult.score.rank === 'S' || 
                           scoreResult.score.rank === 'A' || (scoreResult.score.rank === 'B' && !isBossLevel);
        if (canProgress) {
          handleNextLevel();
        }
      }
    },
    'h': () => {
      if (gameState === 'playing' && !isPaused) {
        setShowHint(prev => !prev);
        if (!showHint && !hintUsed) {
          setHintUsed(true);
        }
      }
    },
  }, !isPaused && !showChapterIntro && !showBoonSelection);

  return (
    <div className="min-h-screen flex flex-col echo-dots relative">
      {/* Pause Menu */}
      <PauseMenu
        open={isPaused}
        onResume={() => setIsPaused(false)}
        onRestart={() => {
          setIsPaused(false);
          handleRetry();
        }}
        onSettings={() => {
          setIsPaused(false);
          navigate('/settings', { state: { returnTo: '/classic' } });
        }}
        onQuit={() => {
          setIsPaused(false);
          navigate('/chapters');
        }}
        currentLevel={level}
        currentChapter={chapter}
        activeBoon={activeBoons[0] ? getBoonById(activeBoons[0])?.name : undefined}
      />

      {/* Chapter Intro Modal */}
      {showChapterIntro && (
        <ChapterIntro
          chapter={chapterConfig}
          onClose={() => setShowChapterIntro(false)}
        />
      )}

      {/* Boon Selection Modal */}
      {showBoonSelection && boonChoices && (
        <BoonSelection
          precisionBoon={boonChoices.precision}
          efficiencyBoon={boonChoices.efficiency}
          adaptabilityBoon={boonChoices.adaptability}
          onConfirm={handleBoonConfirm}
          onSkip={handleBoonSkip}
          chapterName={chapterConfig.name}
          showAllBoons={isCheatActive('UNLOCK_ALL_BOONS')}
          unlockedBoons={getUnlockedBoons(completedChapters)}
          context={boonSelectionContext}
          currentActiveBoon={activeBoons[0]}
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

      {/* Header with Navigation and Stats */}
      <div className="w-full p-3 md:p-4 space-y-3 flex-shrink-0">
        {/* Row 1: Navigation + Actions */}
        <div className="flex items-center justify-between">
          {/* Menu Button */}
          <button
            onClick={() => navigate('/chapters')}
            className="flat-card p-2 hover:bg-accent/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Change Boon button */}
            {canSwapBoons && (
              <button
                onClick={handleSwapBoonClick}
                className="flat-card px-3 py-2 hover:bg-primary/20 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground hidden md:inline">
                  Change Boon
                </span>
              </button>
            )}

            {/* Hint Button */}
            <button
              onClick={handleHintClick}
              className="flat-card p-2 transition-all flex items-center gap-2 hover:bg-accent/20"
            >
              <Lightbulb className={cn(
                "w-5 h-5",
                showHint ? "text-accent" : "text-foreground"
              )} />
            </button>
          </div>
        </div>

        {/* Row 2-3: Full-Width GameStats */}
        <GameStats
          pingsRemaining={pingsRemaining}
          pingsUsed={pingsUsed}
          elapsedTime={elapsedTime}
          finalTime={finalTime}
          timerEnabled={true}
          pingsMode="limited"
          replaysRemaining={replaysRemaining}
          replaysAvailable={boonEffects.replays}
          levelInfo={{
            chapter,
            level,
          }}
          activeBoon={activeBoons.length > 0 ? getBoonById(activeBoons[0]) : undefined}
          difficulty={difficulty}
        />
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
            onPingReplay={handleReplayPing}
            replaysRemaining={replaysRemaining}
            replaysUsed={replaysUsed}
            chapter={chapter}
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
        <div className="fixed top-24 left-0 right-0 z-40 flex justify-center items-center">
          <div className="animate-bounce">
            <Button
              size="lg"
              onClick={() => setShowSummaryModal(true)}
              className="shadow-2xl bg-primary hover:bg-primary/90 border-2 border-accent"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              View Summary
            </Button>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {gameState === 'summary' && scoreResult && showSummaryModal && (
        <PostRoundSummary
          score={{ ...scoreResult.score, level }}
          proximity={scoreResult.proximity}
          pingsUsed={scoreResult.pingsUsed}
          totalPings={scoreResult.totalPings}
          timeElapsed={scoreResult.timeElapsed}
          onNext={handleNextLevel}
          onRetry={handleRetry}
          onMenu={() => navigate('/')}
          onClose={() => setShowSummaryModal(false)}
          replaysUsed={replaysUsed}
          replaysAvailable={chapterConfig.replaysAvailable}
        />
      )}
    </div>
  );
}
