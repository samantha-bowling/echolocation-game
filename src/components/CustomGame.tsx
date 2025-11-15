import { useLocation, useNavigate } from 'react-router-dom';
import { CustomGameConfig, DEFAULT_CUSTOM_CONFIG } from '@/lib/game/customConfig';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function CustomGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = (location.state?.config as CustomGameConfig) || DEFAULT_CUSTOM_CONFIG;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/custom')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-heading-1">Custom Game</h1>
        </div>

        <div className="flat-card space-y-4">
          <h2 className="text-heading-2">Configuration</h2>
          <div className="space-y-2 text-small text-muted-foreground">
            <p>Pings: {config.pingsMode === 'unlimited' ? '∞' : config.pingsCount}</p>
            <p>Target Size: {config.targetSize}px</p>
            <p>Timer: {config.timerEnabled ? 'Enabled' : 'Disabled'}</p>
            <p>Movement: {config.movementMode === 'static' ? 'Static' : `After ${config.movementTrigger} pings`}</p>
            <p>Theme: {config.theme}</p>
            <p>Noise: {config.noiseLevel}%</p>
            <p>Decoys: {config.decoys ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="text-center text-muted-foreground">
          <p className="text-heading-3">🚧 Custom Game Coming Soon</p>
          <p className="text-small mt-2">This will be implemented in Phase 3</p>
        </div>
      </div>
    </div>
  );
}
