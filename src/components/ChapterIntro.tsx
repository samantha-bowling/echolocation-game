import { useState, useEffect } from 'react';
import { X, Radio, Target, Crosshair, Info, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChapterConfig } from '@/lib/game/chapters';
import { markChapterIntroSeen } from '@/lib/game/chapterStats';

interface ChapterIntroProps {
  chapter: ChapterConfig;
  onClose: () => void;
}

export function ChapterIntro({ chapter, onClose }: ChapterIntroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    markChapterIntroSeen(chapter.id);
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getMechanicDetails = () => {
    switch (chapter.specialMechanic) {
      case 'shrinking_target':
        return {
          title: 'Shrinking Target',
          description: 'The target gets smaller after each ping. Locate it quickly!',
          icon: '🎯',
          gameplayImpact: `The target starts at ${chapter.targetSize}px and shrinks by 3px after each ping, down to a minimum of ${chapter.mechanicDetails?.shrinkAmount ? chapter.targetSize - (chapter.mechanicDetails.shrinkAmount * 10) : 40}px. By your 4th ping, the target will be significantly smaller, making precise clicks much harder.`,
          strategyTip: 'Use your first 2-3 pings to narrow down the general area with broad triangulation, then make your final pings count when the target is smallest. Speed matters—every ping makes your job harder!',
        };
      case 'moving_target':
        return {
          title: 'Moving Target',
          description: 'The target drifts to a new location after each ping. Track its movement!',
          icon: '🌊',
          gameplayImpact: `After each ping, the target moves ${chapter.mechanicDetails?.moveDistance || 30}px in a random direction. The target can drift across the entire arena, making previous pings potentially misleading. You must track the movement pattern and predict where it is heading.`,
          strategyTip: 'Pay attention to the direction of movement between pings. Use stereo positioning and volume changes to track the drift. Consider placing pings in a pattern that helps you predict the next movement rather than just triangulating static positions.',
        };
      case 'phantom_targets':
        return {
          title: 'Phantom Echoes',
          description: 'Decoy targets appear to confuse you. Only the real target makes sound!',
          icon: '👻',
          gameplayImpact: `You will see ${(chapter.mechanicDetails?.phantomCount || 2) + 1} circular targets on the canvas, but only ONE is real. The ${chapter.mechanicDetails?.phantomCount || 2} phantom targets are visual decoys that produce no audio feedback whatsoever. Your eyes will deceive you—only your ears reveal the truth.`,
          strategyTip: 'Close your eyes and listen carefully. Ping near each visible target and use audio cues (volume, stereo positioning, pitch) to identify which one produces sound. Visual appearance means nothing—trust your ears! The phantom targets are completely silent.',
        };
      case 'combined_challenge':
        return {
          title: 'Ultimate Challenge',
          description: 'All mechanics combined! Shrinking, moving, and phantom targets.',
          icon: '⚡',
          gameplayImpact: 'The target shrinks by 3px per ping AND moves 30px in a random direction after each ping, AND 2 phantom decoy targets are present. This is the ultimate test: you must track a moving target that is getting smaller while ignoring visual distractions and relying purely on audio feedback.',
          strategyTip: 'This requires mastery of all previous strategies. Eliminate phantom targets first by testing each visible circle with audio. Then track the movement of the real target while accounting for its shrinking size. Use every ping efficiently—you have very limited resources for an extremely complex challenge.',
        };
      default:
        return {
          title: 'Classic Mode',
          description: 'Learn the fundamentals of echolocation.',
          icon: '🔵',
          gameplayImpact: null,
          strategyTip: null,
        };
    }
  };

  const mechanic = getMechanicDetails();

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background: `linear-gradient(135deg, ${chapter.theme.primary}20, ${chapter.theme.secondary}30)`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        className={`relative max-w-2xl w-full bg-card/95 backdrop-blur-sm rounded-2xl border-2 p-8 shadow-2xl transition-all duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
        style={{
          borderColor: chapter.theme.primary,
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-secondary/50 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="space-y-6 text-center">
          {/* Chapter Badge */}
          <div
            className="inline-block px-4 py-1 rounded-full text-sm font-semibold"
            style={{
              background: `${chapter.theme.primary}30`,
              color: chapter.theme.primary,
            }}
          >
            Chapter {chapter.id}
          </div>

          {/* Chapter Title */}
          <h2
            className="text-5xl font-display font-bold tracking-tight"
            style={{ color: chapter.theme.primary }}
          >
            {chapter.name}
          </h2>

          {/* Description */}
          <p className="text-xl text-muted-foreground">{chapter.description}</p>

          {/* Mechanic Preview */}
          {chapter.specialMechanic && (
            <div
              className="relative p-6 rounded-xl border-2 space-y-4 animate-pulse"
              style={{
                borderColor: `${chapter.theme.secondary}50`,
                background: `${chapter.theme.primary}10`,
              }}
            >
              <div className="text-6xl">{mechanic.icon}</div>
              <h3 className="text-2xl font-display font-bold text-foreground">
                {mechanic.title}
              </h3>
              <p className="text-muted-foreground">{mechanic.description}</p>
            </div>
          )}

          {/* Gameplay Impact */}
          {mechanic.gameplayImpact && (
            <div
              className="p-5 rounded-xl border-2 space-y-3 text-left"
              style={{
                borderColor: chapter.theme.primary,
                background: `${chapter.theme.primary}08`,
              }}
            >
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5" style={{ color: chapter.theme.primary }} />
                <h4 className="font-semibold text-foreground">How It Works</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {mechanic.gameplayImpact}
              </p>
            </div>
          )}

          {/* Strategy Tip */}
          {mechanic.strategyTip && (
            <div
              className="p-5 rounded-xl border space-y-3 text-left"
              style={{
                borderColor: `${chapter.theme.secondary}40`,
                background: `${chapter.theme.secondary}12`,
              }}
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" style={{ color: chapter.theme.secondary }} />
                <h4 className="font-semibold text-foreground">Strategy Tip</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {mechanic.strategyTip}
              </p>
            </div>
          )}

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div
              className="p-4 rounded-lg space-y-2"
              style={{ background: `${chapter.theme.primary}15` }}
            >
              <Radio className="w-6 h-6 mx-auto" style={{ color: chapter.theme.primary }} />
              <div className="text-2xl font-bold text-foreground">{chapter.basePings}</div>
              <div className="text-xs text-muted-foreground">Starting Pings</div>
            </div>
            <div
              className="p-4 rounded-lg space-y-2"
              style={{ background: `${chapter.theme.primary}15` }}
            >
              <Target className="w-6 h-6 mx-auto" style={{ color: chapter.theme.primary }} />
              <div className="text-2xl font-bold text-foreground">10</div>
              <div className="text-xs text-muted-foreground">Levels</div>
            </div>
            <div
              className="p-4 rounded-lg space-y-2"
              style={{ background: `${chapter.theme.primary}15` }}
            >
              <Crosshair className="w-6 h-6 mx-auto" style={{ color: chapter.theme.primary }} />
              <div className="text-2xl font-bold text-foreground">
                {chapter.targetSize}px
              </div>
              {/* Visual preview circle */}
              <div className="flex items-center justify-center py-2">
                <div
                  className="rounded-full border-2"
                  style={{
                    width: `${chapter.targetSize}px`,
                    height: `${chapter.targetSize}px`,
                    borderColor: chapter.theme.primary,
                    background: `${chapter.theme.primary}20`,
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground">Target Size</div>
            </div>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            style={{
              background: chapter.theme.primary,
              color: 'white',
            }}
            onClick={handleClose}
          >
            Begin Chapter {chapter.id}
          </Button>
        </div>
      </div>
    </div>
  );
}
