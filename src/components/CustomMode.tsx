import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AUDIO_THEMES } from '@/lib/audio/engine';

export function CustomMode() {
  const navigate = useNavigate();
  
  const [pings, setPings] = useState([5]);
  const [targetSize, setTargetSize] = useState([100]);
  const [movement, setMovement] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState([0]);
  const [decoys, setDecoys] = useState(false);
  const [theme, setTheme] = useState('sonar');

  const handleBegin = () => {
    // For MVP, navigate to classic game with custom settings
    // In future, this would navigate to a custom game screen
    navigate('/classic');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="hover-lift"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Menu
          </Button>
          <h1 className="text-heading-2">Custom Mode</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Config */}
      <div className="max-w-2xl mx-auto p-6 space-y-8 py-12">
        <div className="space-y-6">
          {/* Pings */}
          <div className="flat-card space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Number of Pings</Label>
              <span className="text-heading-3 font-mono">{pings[0]}</span>
            </div>
            <Slider
              value={pings}
              onValueChange={setPings}
              min={3}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          {/* Target Size */}
          <div className="flat-card space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Target Size</Label>
              <span className="text-heading-3 font-mono">{targetSize[0]}px</span>
            </div>
            <Slider
              value={targetSize}
              onValueChange={setTargetSize}
              min={50}
              max={200}
              step={10}
              className="w-full"
            />
          </div>

          {/* Movement */}
          <div className="flat-card flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Target Movement</Label>
              <p className="text-small text-muted-foreground">
                Target slowly drifts during round
              </p>
            </div>
            <Switch checked={movement} onCheckedChange={setMovement} />
          </div>

          {/* Noise */}
          <div className="flat-card space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Noise Level</Label>
              <span className="text-heading-3 font-mono">{noiseLevel[0]}%</span>
            </div>
            <Slider
              value={noiseLevel}
              onValueChange={setNoiseLevel}
              min={0}
              max={50}
              step={5}
              className="w-full"
            />
            <p className="text-tiny text-muted-foreground">
              Random interference in audio feedback
            </p>
          </div>

          {/* Decoys */}
          <div className="flat-card flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Decoy Sounds</Label>
              <p className="text-small text-muted-foreground">
                False echoes to mislead you
              </p>
            </div>
            <Switch checked={decoys} onCheckedChange={setDecoys} />
          </div>

          {/* Theme */}
          <div className="flat-card space-y-4">
            <Label className="text-base">Sound Theme</Label>
            <div className="grid grid-cols-2 gap-2">
              {AUDIO_THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    theme === t.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <p className="text-small font-semibold">{t.name}</p>
                  <p className="text-tiny text-muted-foreground">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Begin Button */}
        <Button
          onClick={handleBegin}
          size="lg"
          className="w-full h-14 text-base hover-lift"
        >
          <Play className="w-5 h-5 mr-2" />
          Begin Custom Round
        </Button>
      </div>
    </div>
  );
}
