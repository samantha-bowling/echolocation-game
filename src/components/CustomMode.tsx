import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Save, Trash2, Lightbulb, Download, Upload, Share2, BarChart3, Target, Zap, Infinity, Gamepad2, MapPin, Volume2, Settings, PlayCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AUDIO_THEMES } from '@/lib/audio/engine';
import { CustomGameConfig, validateCustomConfig, ARENA_PRESETS, loadCustomPresets, saveCustomPreset, deleteCustomPreset, CustomPreset, decodeShareCodeToConfig, DEFAULT_CUSTOM_CONFIG } from '@/lib/game/customConfig';
import { toast } from '@/hooks/use-toast';
import { InfoTooltip } from '@/components/InfoTooltip';
import { hasActiveSessionDB, loadGameSessionDB, clearGameSessionDB, loadLastConfigDB, saveLastConfigDB, clearLastConfigDB, getSessionAgeDB } from '@/lib/game/customSessionDB';
import { exportSessionAsFile, importSessionFromFile, generateShareURL } from '@/lib/game/exportImport';

export function CustomMode() {
  const navigate = useNavigate();
  
  const [pingsMode, setPingsMode] = useState<'limited' | 'unlimited'>('limited');
  const [pingsCount, setPingsCount] = useState(5);
  const [showPingLocations, setShowPingLocations] = useState(true);
  const [pingReplaysEnabled, setPingReplaysEnabled] = useState(false);
  const [replaysCount, setReplaysCount] = useState(0);
  const [targetSize, setTargetSize] = useState([100]);
  const [movementMode, setMovementMode] = useState<'static' | 'after-pings'>('static');
  const [movementTrigger, setMovementTrigger] = useState(3);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [noiseLevel, setNoiseLevel] = useState([0]);
  const [decoys, setDecoys] = useState(false);
  const [theme, setTheme] = useState('sonar');
  const [arenaSize, setArenaSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [numberOfRounds, setNumberOfRounds] = useState(1);
  const [hintsEnabled, setHintsEnabled] = useState(false);
  const [hintLevel, setHintLevel] = useState<'basic' | 'detailed'>('basic');
  
  // Preset management
  const [presets, setPresets] = useState<Record<string, CustomPreset>>({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  
  // Win condition
  const [winConditionType, setWinConditionType] = useState<'none' | 'proximity'>('none');
  const [proximityThreshold, setProximityThreshold] = useState(80);
  const [enforceWinCondition, setEnforceWinCondition] = useState(true);

  // Session state
  const [hasSession, setHasSession] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [loadedSession, setLoadedSession] = useState<any>(null);
  const [sessionAge, setSessionAge] = useState(0);

  // Export/Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setPresets(loadCustomPresets());
    
    // Load last used config and check for active session
    const loadData = async () => {
      const lastConfig = await loadLastConfigDB();
      if (lastConfig) {
        loadConfigIntoState(lastConfig);
      }

      const activeSession = await hasActiveSessionDB();
      setHasSession(activeSession);
      
      if (activeSession) {
        const session = await loadGameSessionDB();
        setLoadedSession(session);
        const age = await getSessionAgeDB();
        setSessionAge(age);
      }
      
      setSessionLoading(false);
    };
    
    loadData();
  }, []);

  const loadConfigIntoState = (config: CustomGameConfig) => {
    setPingsMode(config.pingsMode);
    setPingsCount(config.pingsCount);
    setShowPingLocations(config.showPingLocations ?? true);
    setPingReplaysEnabled(config.pingReplaysEnabled ?? false);
    setReplaysCount(config.replaysCount ?? 0);
    setTargetSize([config.targetSize]);
    setMovementMode(config.movementMode);
    setMovementTrigger(config.movementTrigger || 3);
    setTimerEnabled(config.timerEnabled);
    setTheme(config.theme);
    setNoiseLevel([config.noiseLevel]);
    setDecoys(config.decoys);
    setArenaSize(config.arenaSize);
    setNumberOfRounds(config.numberOfRounds);
    setHintsEnabled(config.hintsEnabled);
    setHintLevel(config.hintLevel);
    setWinConditionType(config.winCondition?.type || 'none');
    setProximityThreshold(config.winCondition?.proximityThreshold || 80);
    setEnforceWinCondition(config.enforceWinCondition ?? true);
  };

  const handleBegin = async () => {
    const config: CustomGameConfig = {
      pingsMode,
      pingsCount,
      showPingLocations,
      pingReplaysEnabled,
      replaysCount,
      targetSize: targetSize[0],
      movementMode,
      movementTrigger,
      timerEnabled,
      theme,
      noiseLevel: noiseLevel[0],
      decoys,
      arenaSize,
      numberOfRounds,
      hintsEnabled,
      hintLevel,
      winCondition: winConditionType === 'none' ? { type: 'none' } : {
        type: winConditionType,
        proximityThreshold,
      },
      enforceWinCondition,
    };

    const validatedConfig = validateCustomConfig(config);
    
    // Save as last used config
    await saveLastConfigDB(validatedConfig);
    
    navigate('/custom-game', { state: { config: validatedConfig } });
  };

  const handleResumeGame = () => {
    navigate('/custom-game', { state: { resumeSession: true } });
  };

  const handleAbandonSession = async () => {
    await clearGameSessionDB();
    setHasSession(false);
    toast({
      title: 'Session Cleared',
      description: 'Your saved game progress has been removed.',
    });
  };

  const handleResetToDefaults = async () => {
    loadConfigIntoState(DEFAULT_CUSTOM_CONFIG);
    await clearLastConfigDB();
    toast({
      title: 'Reset to Defaults',
      description: 'All settings have been reset to default values.',
    });
  };

  // Export/Import handlers
  const handleExportSession = async () => {
    if (!loadedSession) return;

    try {
      exportSessionAsFile(loadedSession);
      toast({
        title: 'Game Exported',
        description: 'Your game has been saved to a file',
        duration: 2000,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export game',
        variant: 'destructive',
      });
    }
  };

  const handleImportSession = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const session = await importSessionFromFile(file);
      await clearGameSessionDB(); // Clear existing session
      await loadGameSessionDB(); // This will save the imported session

      setHasSession(true);
      setLoadedSession(session);

      toast({
        title: 'Game Imported',
        description: 'Successfully imported game from file',
        duration: 2000,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import game',
        variant: 'destructive',
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGenerateShareUrl = async () => {
    if (!loadedSession) return;

    try {
      const url = await generateShareURL(loadedSession);
      setShareUrl(url);
      setShowShareDialog(true);
    } catch (error) {
      console.error('Share URL generation failed:', error);
      toast({
        title: 'Share Failed',
        description: error instanceof Error ? error.message : 'Failed to generate share link',
        variant: 'destructive',
      });
    }
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link Copied',
      description: 'Share link copied to clipboard',
      duration: 2000,
    });
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    
    const config: CustomGameConfig = {
      pingsMode,
      pingsCount,
      showPingLocations,
      pingReplaysEnabled,
      replaysCount,
      targetSize: targetSize[0],
      movementMode,
      movementTrigger,
      timerEnabled,
      theme,
      noiseLevel: noiseLevel[0],
      decoys,
      arenaSize,
      numberOfRounds,
      hintsEnabled,
      hintLevel,
      winCondition: winConditionType === 'none' ? { type: 'none' } : {
        type: winConditionType,
        proximityThreshold,
      },
      enforceWinCondition,
    };
    
    saveCustomPreset(presetName.trim(), config);
    setPresets(loadCustomPresets());
    setShowSaveDialog(false);
    setPresetName('');
  };

  const loadPreset = (preset: CustomPreset) => {
    loadConfigIntoState(preset.config);
  };

  const handleDeletePreset = (name: string) => {
    deleteCustomPreset(name);
    setPresets(loadCustomPresets());
  };

  const handleImportConfig = () => {
    const decoded = decodeShareCodeToConfig(importCode);
    if (decoded) {
      loadConfigIntoState(decoded);
      
      setShowImportDialog(false);
      setImportCode('');
      setImportError('');
      toast({ title: 'Configuration imported successfully!' });
    } else {
      setImportError('Invalid share code. Please check and try again.');
    }
  };

  const loadPresetConfig = (preset: 'easy' | 'normal' | 'hard') => {
    switch (preset) {
      case 'easy':
        setPingsMode('unlimited');
        setPingsCount(10);
        setTargetSize([120]);
        setTimerEnabled(false);
        setHintsEnabled(true);
        setHintLevel('detailed');
        setArenaSize('medium');
        setMovementMode('static');
        setMovementTrigger(3);
        setDecoys(false);
        setNoiseLevel([0]);
        setNumberOfRounds(1);
        setWinConditionType('none');
        toast({
          title: "Easy Mode Loaded",
          description: "Settings configured for learning and practice",
        });
        break;
        
      case 'normal':
        setPingsMode('limited');
        setPingsCount(5);
        setTargetSize([100]);
        setTimerEnabled(true);
        setHintsEnabled(true);
        setHintLevel('basic');
        setArenaSize('medium');
        setMovementMode('static');
        setMovementTrigger(3);
        setDecoys(false);
        setNoiseLevel([0]);
        setNumberOfRounds(1);
        setWinConditionType('none');
        toast({
          title: "Normal Mode Loaded",
          description: "Balanced difficulty settings",
        });
        break;
        
      case 'hard':
        setPingsMode('limited');
        setPingsCount(3);
        setTargetSize([60]);
        setTimerEnabled(true);
        setHintsEnabled(false);
        setHintLevel('basic');
        setArenaSize('large');
        setMovementMode('after-pings');
        setMovementTrigger(2);
        setDecoys(false);
        setNoiseLevel([20]);
        setNumberOfRounds(1);
        setWinConditionType('proximity');
        setProximityThreshold(90);
        toast({
          title: "Hard Mode Loaded",
          description: "Challenge mode for experienced players",
        });
        break;
    }
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/custom-stats')}
            className="hover-lift"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Stats
          </Button>
        </div>
      </header>

      {/* Config */}
      <div className="max-w-2xl mx-auto p-6 space-y-8 py-12">
        {/* Resume Game Banner */}
        {!sessionLoading && hasSession && loadedSession && (
          <div className="flat-card bg-primary/10 border-2 border-primary/30 space-y-4">
            <div className="flex items-start gap-3">
              <PlayCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-heading-3 text-primary mb-1">Resume Game</h3>
                <p className="text-small text-muted-foreground">
                  You have a saved game in progress from Round {loadedSession.currentRound}.
                  {sessionAge > 0 && ` (${sessionAge} day${sessionAge > 1 ? 's' : ''} ago)`}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleResumeGame} className="flex-1" size="lg">
                <PlayCircle className="w-4 h-4 mr-2" />
                Resume Game
              </Button>
              <Button onClick={handleAbandonSession} variant="outline" className="flex-1" size="lg">
                Start Fresh
              </Button>
            </div>

            {/* Export/Import Controls */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              <Button onClick={handleExportSession} variant="ghost" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleGenerateShareUrl} variant="ghost" size="sm" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="sm" className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        )}

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportSession}
        />
        {/* Quick Presets Section */}
        <section className="flat-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-heading-3">Quick Presets</h3>
            <InfoTooltip content="Choose a preset difficulty or customize your own settings below" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Easy Mode */}
            <button
              onClick={() => loadPresetConfig('easy')}
              className="p-4 rounded-xl border-2 border-border hover:border-green-500/50 hover:bg-green-500/5 transition-all text-left space-y-2 group"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center text-lg">
                  😊
                </div>
                <h4 className="text-base font-semibold group-hover:text-green-400 transition-colors">Easy Mode</h4>
              </div>
              <ul className="text-tiny text-muted-foreground space-y-1">
                <li>• Unlimited pings</li>
                <li>• Large target (120px)</li>
                <li>• No timer pressure</li>
                <li>• Hints enabled</li>
                <li>• Medium arena</li>
              </ul>
              <p className="text-tiny text-muted-foreground italic">Perfect for learning the game</p>
            </button>

            {/* Normal Mode */}
            <button
              onClick={() => loadPresetConfig('normal')}
              className="p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left space-y-2 group"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold group-hover:text-primary transition-colors">Normal Mode</h4>
              </div>
              <ul className="text-tiny text-muted-foreground space-y-1">
                <li>• 5 pings available</li>
                <li>• Medium target (100px)</li>
                <li>• Timer enabled</li>
                <li>• Basic hints</li>
                <li>• Medium arena</li>
              </ul>
              <p className="text-tiny text-muted-foreground italic">Balanced challenge</p>
            </button>

            {/* Hard Mode */}
            <button
              onClick={() => loadPresetConfig('hard')}
              className="p-4 rounded-xl border-2 border-border hover:border-red-500/50 hover:bg-red-500/5 transition-all text-left space-y-2 group"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold group-hover:text-red-400 transition-colors">Hard Mode</h4>
              </div>
              <ul className="text-tiny text-muted-foreground space-y-1">
                <li>• Only 3 pings</li>
                <li>• Small target (60px)</li>
                <li>• Timer enabled</li>
                <li>• No hints</li>
                <li>• Large arena</li>
              </ul>
              <p className="text-tiny text-muted-foreground italic">For experienced players</p>
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-tiny text-muted-foreground">
            <Lightbulb className="w-4 h-4" />
            <span>Presets load instantly. Adjust any setting below to customize further.</span>
          </div>
        </section>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or Customize</span>
          </div>
        </div>

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
          {/* Game Rules Section */}
          <div className="space-y-2 mb-4 pt-8">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <h3 className="text-heading-3">Game Rules</h3>
            </div>
            <p className="text-small text-muted-foreground">Configure core gameplay settings</p>
          </div>

          {/* Rounds Selector */}
          <div className="flat-card space-y-4">
            <div className="space-y-1">
              <Label className="text-base">Rounds</Label>
              <p className="text-small text-muted-foreground">
                {numberOfRounds === -1 
                  ? 'Cozy Mode - Play unlimited rounds'
                  : numberOfRounds === 1
                    ? 'Single round mode'
                    : `Play ${numberOfRounds} rounds with cumulative scoring`
                }
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant={numberOfRounds === 1 ? 'default' : 'outline'}
                  onClick={() => setNumberOfRounds(1)}
                  size="sm"
                >
                  1
                </Button>
                <Button
                  variant={numberOfRounds === 3 ? 'default' : 'outline'}
                  onClick={() => setNumberOfRounds(3)}
                  size="sm"
                >
                  3
                </Button>
                <Button
                  variant={numberOfRounds === 5 ? 'default' : 'outline'}
                  onClick={() => setNumberOfRounds(5)}
                  size="sm"
                >
                  5
                </Button>
                <Button
                  variant={numberOfRounds === 10 ? 'default' : 'outline'}
                  onClick={() => setNumberOfRounds(10)}
                  size="sm"
                >
                  10
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={numberOfRounds === 25 ? 'default' : 'outline'}
                  onClick={() => setNumberOfRounds(25)}
                  size="sm"
                >
                  25
                </Button>
                <Button
                  variant={numberOfRounds === 50 ? 'default' : 'outline'}
                  onClick={() => setNumberOfRounds(50)}
                  size="sm"
                >
                  50
                </Button>
                <Button
                  variant={numberOfRounds === -1 ? 'default' : 'outline'}
                  onClick={() => setNumberOfRounds(-1)}
                  size="sm"
                  className="col-span-1"
                >
                  <Infinity className="w-4 h-4 mr-1" />
                  Cozy
                </Button>
              </div>
            </div>
          </div>

          {/* Win Conditions */}
          <div className="flat-card space-y-4">
            <div className="space-y-1">
              <Label className="text-base">Win Condition</Label>
              <p className="text-small text-muted-foreground">
                {winConditionType === 'none' 
                  ? 'No requirements - play for score only'
                  : `Must be within ${proximityThreshold}% to complete the round`
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setWinConditionType('none')}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  winConditionType === 'none'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-foreground/20'
                }`}
              >
                <p className="text-small font-semibold">No Requirement</p>
                <p className="text-tiny text-muted-foreground">
                  Just play for the highest score possible
                </p>
              </button>
              
              <button
                onClick={() => setWinConditionType('proximity')}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  winConditionType === 'proximity'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-foreground/20'
                }`}
              >
                <p className="text-small font-semibold">Proximity Requirement</p>
                <p className="text-tiny text-muted-foreground">
                  Must get close enough to the target to proceed
                </p>
              </button>
            </div>
            
            {winConditionType === 'proximity' && (
              <div className="pt-2 space-y-4 border-t border-border">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-small">Required Proximity</Label>
                    <span className="text-base font-mono">{proximityThreshold}%</span>
                  </div>
                  <Slider
                    value={[proximityThreshold]}
                    onValueChange={(v) => setProximityThreshold(v[0])}
                    min={50}
                    max={95}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-tiny text-muted-foreground">
                    Higher = must be closer to target
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="space-y-1">
                    <Label className="text-small">Enforce to Advance</Label>
                    <p className="text-tiny text-muted-foreground">
                      {enforceWinCondition 
                        ? 'Must meet condition to proceed to next round'
                        : 'Can proceed even if condition not met'
                      }
                    </p>
                  </div>
                  <Switch checked={enforceWinCondition} onCheckedChange={setEnforceWinCondition} />
                </div>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="flat-card flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Timer</Label>
              <p className="text-small text-muted-foreground">
                {timerEnabled ? 'Time tracking enabled' : 'Relaxed mode - no timer'}
              </p>
            </div>
            <Switch checked={timerEnabled} onCheckedChange={setTimerEnabled} />
          </div>

          {/* Ping Configuration Section */}
          <div className="space-y-2 mb-4 pt-8">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="text-heading-3">Ping Configuration</h3>
            </div>
            <p className="text-small text-muted-foreground">Control how you locate the target</p>
          </div>

          {/* Consolidated Ping Settings */}
          <div className="flat-card space-y-4">
            {/* Ping Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Ping Mode</Label>
                <p className="text-small text-muted-foreground">
                  {pingsMode === 'limited' ? `${pingsCount} pings available` : 'Unlimited pings'}
                </p>
              </div>
              <Switch checked={pingsMode === 'unlimited'} onCheckedChange={(v) => setPingsMode(v ? 'unlimited' : 'limited')} />
            </div>
            
            {/* Ping Count (only if limited) */}
            {pingsMode === 'limited' && (
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Number of Pings</Label>
                  <span className="text-heading-3 font-mono">{pingsCount}</span>
                </div>
                <Slider
                  value={[pingsCount]}
                  onValueChange={(v) => setPingsCount(v[0])}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
            )}

            {/* Show Ping Locations */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="space-y-1">
                <Label className="text-base">Show Ping Locations</Label>
                <p className="text-small text-muted-foreground">
                  {showPingLocations 
                    ? 'Visual markers show where you pinged'
                    : '🔥 Hardcore: Audio only, no visual markers!'
                  }
                </p>
              </div>
              <Switch checked={showPingLocations} onCheckedChange={setShowPingLocations} />
            </div>

            {/* Ping Replays */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Ping Replays</Label>
                  <p className="text-small text-muted-foreground">
                    {pingReplaysEnabled 
                      ? `Replay previous pings (${replaysCount === 0 ? 'Unlimited' : replaysCount})`
                      : 'No replays - remember your pings!'
                    }
                  </p>
                </div>
                <Switch checked={pingReplaysEnabled} onCheckedChange={setPingReplaysEnabled} />
              </div>
              
              {pingReplaysEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-small">Replay Count</Label>
                    <span className="text-base font-mono">{replaysCount === 0 ? '∞' : replaysCount}</span>
                  </div>
                  <Slider
                    value={[replaysCount]}
                    onValueChange={(v) => setReplaysCount(v[0])}
                    min={0}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-tiny text-muted-foreground text-center">
                    {replaysCount === 0 && '♾️ Unlimited replays'}
                    {replaysCount === 1 && '1 replay available'}
                    {replaysCount > 1 && `${replaysCount} replays available`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Target Settings Section */}
          <div className="space-y-2 mb-4 pt-8">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-heading-3">Target Settings</h3>
            </div>
            <p className="text-small text-muted-foreground">Configure target size and behavior</p>
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
              min={40}
              max={150}
              step={10}
              className="w-full"
            />
            
            {/* Visual Preview */}
            <div className="flex items-center justify-center p-6 bg-muted/20 rounded-lg border border-border/40">
              <div 
                className="rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center transition-all"
                style={{ 
                  width: `${targetSize[0]}px`, 
                  height: `${targetSize[0]}px` 
                }}
              >
                <span className="text-xs text-primary font-medium">{targetSize[0]}px</span>
              </div>
            </div>
            
            <p className="text-tiny text-muted-foreground">
              Larger targets are easier to locate
            </p>
          </div>

          {/* Target Movement */}
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
              <div className="pt-2 space-y-2 border-t border-border">
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

          {/* Audio Settings Section */}
          <div className="space-y-2 mb-4 pt-8">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              <h3 className="text-heading-3">Audio Settings</h3>
            </div>
            <p className="text-small text-muted-foreground">Customize sound feedback and difficulty</p>
          </div>

          {/* Sound Theme */}
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

          {/* Noise Level */}
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

          {/* Decoy Sounds */}
          <div className="flat-card flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Decoy Sounds</Label>
              <p className="text-small text-muted-foreground">
                False echoes to mislead you
              </p>
            </div>
            <Switch checked={decoys} onCheckedChange={setDecoys} />
          </div>

          {/* Advanced Settings Section */}
          <div className="space-y-2 mb-4 pt-8">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-heading-3">Advanced Settings</h3>
            </div>
            <p className="text-small text-muted-foreground">Fine-tune your experience</p>
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

          {/* Hints */}
          <div className="flat-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Hints</Label>
                <p className="text-small text-muted-foreground">
                  {hintsEnabled 
                    ? hintLevel === 'detailed' 
                      ? 'Detailed guidance'
                      : 'Basic help' 
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
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleBegin}
            size="lg"
            className="w-full h-14 text-base hover-lift"
          >
            <Play className="w-5 h-5 mr-2" />
            Begin Custom Round
          </Button>
          
          <Button
            onClick={handleResetToDefaults}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
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

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="frosted-modal max-w-md w-full space-y-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-2">Import Configuration</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportCode('');
                  setImportError('');
                }}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-3">
              <p className="text-small text-muted-foreground">
                Paste a share code to load its configuration:
              </p>
              
              <input
                type="text"
                value={importCode}
                onChange={(e) => {
                  setImportCode(e.target.value);
                  setImportError('');
                }}
                placeholder="ECHO-xxxxx..."
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-tiny"
              />
              
              {importError && (
                <p className="text-tiny text-destructive">{importError}</p>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportCode('');
                  setImportError('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleImportConfig}
                disabled={!importCode.trim()}
              >
                Import
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Share URL Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Game</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-small text-muted-foreground">
              Anyone with this link can import and play your saved game.
            </p>
            
            <div className="flex items-center gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 font-mono text-tiny"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button onClick={handleCopyShareUrl} size="sm">
                Copy
              </Button>
            </div>
            
            <div className="flat-card bg-warning/10 border-warning/30 p-3">
              <p className="text-tiny text-warning-foreground flex items-start gap-2">
                <span className="text-base">⚠️</span>
                <span>Share link contains your full game state. Only share with trusted people.</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowShareDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
