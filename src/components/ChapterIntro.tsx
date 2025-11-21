import { useState, useEffect } from 'react';
import { X, Radio, Target, Crosshair, Waves, Ghost, Zap } from 'lucide-react';
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
        };
      case 'moving_target':
        return {
          title: 'Moving Target',
          description: 'The target drifts to a new location after each ping. Track its movement!',
          icon: '🌊',
        };
      case 'phantom_targets':
        return {
          title: 'Phantom Echoes',
          description: 'Decoy targets appear to confuse you. Only the real target makes sound!',
          icon: '👻',
        };
      case 'combined_challenge':
        return {
          title: 'Ultimate Challenge',
          description: 'All mechanics combined! Shrinking, moving, and phantom targets.',
          icon: '⚡',
        };
      default:
        return {
          title: 'Classic Mode',
          description: 'Learn the fundamentals of echolocation.',
          icon: '🔵',
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
