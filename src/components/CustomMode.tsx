import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Save, Trash2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AUDIO_THEMES } from '@/lib/audio/engine';
import { CustomGameConfig, validateCustomConfig, ARENA_PRESETS, loadCustomPresets, saveCustomPreset, deleteCustomPreset, CustomPreset } from '@/lib/game/customConfig';

export function CustomMode() {
  const navigate = useNavigate();
  
  const [pingsMode, setPingsMode] = useState<'limited' | 'unlimited'>('limited');
  const [pingsCount, setPingsCount] = useState(5);
  const [targetSize, setTargetSize] = useState([100]);
  const [movementMode, setMovementMode] = useState<'static' | 'after-pings'>('static');
  const [movementTrigger, setMovementTrigger] = useState(3);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [noiseLevel, setNoiseLevel] = useState([0]);
  const [decoys, setDecoys] = useState(false);
  const [theme, setTheme] = useState('sonar');
  const [arenaSize, setArenaSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [multiRound, setMultiRound] = useState(false);
  const [numberOfRounds, setNumberOfRounds] = useState(3);
  const [hintsEnabled, setHintsEnabled] = useState(false);
  const [hintLevel, setHintLevel] = useState<'basic' | 'detailed'>('basic');
  
  // Preset management
  const [presets, setPresets] = useState<Record<string, CustomPreset>>({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    setPresets(loadCustomPresets());
  }, []);

  const handleBegin = () => {
    const config: CustomGameConfig = {
      pingsMode,
      pingsCount,
      targetSize: targetSize[0],
      movementMode,
      movementTrigger,
      timerEnabled,
      theme,
      noiseLevel: noiseLevel[0],
      decoys,
      arenaSize,
      multiRound,
      numberOfRounds,
      hintsEnabled,
      hintLevel,
    };

    const validatedConfig = validateCustomConfig(config);
    navigate('/custom-game', { state: { config: validatedConfig } });
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    
    const config: CustomGameConfig = {
      pingsMode,
      pingsCount,
      targetSize: targetSize[0],
      movementMode,
      movementTrigger,
      timerEnabled,
      theme,
      noiseLevel: noiseLevel[0],
      decoys,
      arenaSize,
      multiRound,
      numberOfRounds,
      hintsEnabled,
      hintLevel,
    };
    
    saveCustomPreset(presetName.trim(), config);
    setPresets(loadCustomPresets());
    setShowSaveDialog(false);
    setPresetName('');
  };

  const loadPreset = (preset: CustomPreset) => {
    const config = preset.config;
    setPingsMode(config.pingsMode);
    setPingsCount(config.pingsCount);
    setTargetSize([config.targetSize]);
    setMovementMode(config.movementMode);
    setMovementTrigger(config.movementTrigger || 3);
    setTimerEnabled(config.timerEnabled);
    setTheme(config.theme);
    setNoiseLevel([config.noiseLevel]);
    setDecoys(config.decoys);
    setArenaSize(config.arenaSize);
    setMultiRound(config.multiRound);
    setNumberOfRounds(config.numberOfRounds);
    setHintsEnabled(config.hintsEnabled);
    setHintLevel(config.hintLevel);
  };

  const handleDeletePreset = (name: string) => {
    deleteCustomPreset(name);
    setPresets(loadCustomPresets());
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
        {/* Presets Section */}
        {Object.keys(presets).length > 0 && (
          <div className="flat-card space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Saved Presets</Label>
              <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                <Save className="w-4 h-4 mr-2" />
                Save Current
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(presets).map(([name, preset]) => (
                <div
                  key={name}
                  className="group relative flat-card bg-card/50 hover:bg-card transition-colors cursor-pointer p-3"
                  onClick={() => loadPreset(preset)}
                >
                  <p className="text-small font-medium mb-1">{name}</p>
                  <p className="text-tiny text-muted-foreground">
                    {preset.config.pingsMode === 'unlimited' ? '∞' : preset.config.pingsCount} pings • 
                    {preset.config.targetSize}px target
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(name);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Pings */}
          <div className="flat-card space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Number of Pings</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={pingsMode === 'unlimited' ? '' : pingsCount}
                  onChange={(e) => setPingsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={pingsMode === 'unlimited'}
                  className="w-20 h-9 text-center font-mono"
                  placeholder="∞"
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={pingsMode === 'unlimited'}
                    onCheckedChange={(checked) => setPingsMode(checked ? 'unlimited' : 'limited')}
                  />
                  <Label className="text-small text-muted-foreground cursor-pointer" onClick={() => setPingsMode(pingsMode === 'unlimited' ? 'limited' : 'unlimited')}>
                    Unlimited
                  </Label>
                </div>
              </div>
            </div>
            <p className="text-tiny text-muted-foreground">
              {pingsMode === 'unlimited' 
                ? 'Use as many pings as you need - no ping efficiency bonus'
                : 'Ping efficiency bonus: earn points for unused pings'
              }
            </p>
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
              min={30}
              max={200}
              step={5}
              className="w-full"
            />
            
            {/* Visual Preview */}
            <div className="flex items-center justify-center py-6 bg-muted/30 rounded-lg border border-border relative">
              <div className="absolute top-2 left-3 text-tiny text-muted-foreground">
                Preview (actual size)
              </div>
              <div 
                className="rounded-full border-2 border-primary/50 bg-primary/10 transition-all duration-300"
                style={{
                  width: `${targetSize[0]}px`,
                  height: `${targetSize[0]}px`,
                }}
              />
            </div>
            
            <p className="text-tiny text-muted-foreground text-center">
              {targetSize[0] < 60 && '🔥 Expert: Very small target!'}
              {targetSize[0] >= 60 && targetSize[0] < 100 && '💪 Hard: Challenging size'}
              {targetSize[0] >= 100 && targetSize[0] < 140 && '👌 Medium: Balanced difficulty'}
              {targetSize[0] >= 140 && '🌱 Easy: Large target'}
            </p>
          </div>

          {/* Timer Toggle */}
          <div className="flat-card flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Timer</Label>
              <p className="text-small text-muted-foreground">
                {timerEnabled 
                  ? 'Time penalty applies (-2 pts/sec, max -500)'
                  : 'Casual mode - take your time!'
                }
              </p>
            </div>
            <Switch checked={timerEnabled} onCheckedChange={setTimerEnabled} />
          </div>

          {/* Hints Toggle */}
          <div className="flat-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <Label className="text-base">Hints</Label>
                </div>
                <p className="text-small text-muted-foreground">
                  {hintsEnabled 
                    ? `Get ${hintLevel} hints after using 60% of pings`
                    : 'No hints - pure skill mode'
                  }
                </p>
              </div>
              <Switch checked={hintsEnabled} onCheckedChange={setHintsEnabled} />
            </div>
            
            {hintsEnabled && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={hintLevel === 'basic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHintLevel('basic')}
                  className="w-full"
                >
                  Basic
                </Button>
                <Button
                  variant={hintLevel === 'detailed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHintLevel('detailed')}
                  className="w-full"
                >
                  Detailed
                </Button>
              </div>
            )}
          </div>

          {/* Arena Size */}
          <div className="flat-card space-y-4">
            <Label className="text-base">Arena Size</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(ARENA_PRESETS) as [keyof typeof ARENA_PRESETS, typeof ARENA_PRESETS[keyof typeof ARENA_PRESETS]][]).map(([size, preset]) => (
                <button
                  key={size}
                  onClick={() => setArenaSize(size)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    arenaSize === size
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <p className="text-small font-semibold capitalize">{size}</p>
                  <p className="text-tiny text-muted-foreground">{preset.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Movement */}
          <div className="flat-card space-y-4">
            <Label className="text-base">Target Movement</Label>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setMovementMode('static')}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  movementMode === 'static'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-foreground/20'
                }`}
              >
                <p className="text-small font-semibold">Static Target</p>
                <p className="text-tiny text-muted-foreground">Target stays in one place</p>
              </button>
              
              <button
                onClick={() => setMovementMode('after-pings')}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  movementMode === 'after-pings'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-foreground/20'
                }`}
              >
                <p className="text-small font-semibold">Move After Pings</p>
                <p className="text-tiny text-muted-foreground">
                  Target relocates after you've used {movementTrigger} pings
                </p>
              </button>
            </div>
            
            {movementMode === 'after-pings' && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-small">Move after</Label>
                  <span className="text-small font-mono">{movementTrigger} pings</span>
                </div>
                <Slider
                  value={[movementTrigger]}
                  onValueChange={(v) => setMovementTrigger(v[0])}
                  min={2}
                  max={pingsMode === 'unlimited' ? 10 : Math.max(2, pingsCount - 1)}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
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

          {/* Multi-Round Mode */}
          <div className="flat-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Multi-Round Mode</Label>
                <p className="text-small text-muted-foreground">
                  {multiRound 
                    ? `Play ${numberOfRounds} rounds with cumulative scoring`
                    : 'Single round mode'
                  }
                </p>
              </div>
              <Switch checked={multiRound} onCheckedChange={setMultiRound} />
            </div>
            
            {multiRound && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-small">Number of Rounds</Label>
                  <span className="text-heading-3 font-mono">{numberOfRounds}</span>
                </div>
                <Slider
                  value={[numberOfRounds]}
                  onValueChange={(v) => setNumberOfRounds(v[0])}
                  min={2}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex gap-2">
                  {[2, 3, 5, 7, 10].map(n => (
                    <Button
                      key={n}
                      variant={numberOfRounds === n ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNumberOfRounds(n)}
                      className="flex-1"
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            )}
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

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g., Expert Challenge"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSavePreset();
                  if (e.key === 'Escape') setShowSaveDialog(false);
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
