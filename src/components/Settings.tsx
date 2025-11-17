import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Moon, Sun, Headphones, CheckCircle2, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { audioEngine, AUDIO_THEMES } from '@/lib/audio/engine';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { resetTutorial } from '@/lib/game/tutorial';
import { activateCheat, deactivateCheat, getActiveCheats } from '@/lib/game/cheats';

export function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  const [volume, setVolume] = useState([70]);
  const [audioTheme, setAudioTheme] = useState('sonar');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [calibrationTests, setCalibrationTests] = useState({
    leftRight: false,
    distance: false,
    pitch: false,
    spatial3D: false,
  });
  const [cheatCodeInput, setCheatCodeInput] = useState('');
  const [activeCheats, setActiveCheats] = useState(getActiveCheats());

  useEffect(() => {
    audioEngine.setVolume(volume[0] / 100);
  }, [volume]);

  useEffect(() => {
    audioEngine.setTheme(audioTheme);
  }, [audioTheme]);

  const runCalibrationTest = (testType: 'leftRight' | 'distance' | 'pitch' | 'spatial3D') => {
    audioEngine.initialize();
    
    switch (testType) {
      case 'leftRight':
        // Play left channel, then right channel
        setTimeout(() => {
          audioEngine.playPing(
            { x: 0, y: 500 },
            { x: 100, y: 500 },
            1000
          );
          toast.info('LEFT channel');
        }, 100);
        setTimeout(() => {
          audioEngine.playPing(
            { x: 1000, y: 500 },
            { x: 900, y: 500 },
            1000
          );
          toast.info('RIGHT channel');
        }, 1500);
        setCalibrationTests(prev => ({ ...prev, leftRight: true }));
        break;
        
      case 'distance':
        // Play close, then far
        setTimeout(() => {
          audioEngine.playPing(
            { x: 500, y: 500 },
            { x: 520, y: 500 },
            1000
          );
          toast.info('CLOSE (loud)');
        }, 100);
        setTimeout(() => {
          audioEngine.playPing(
            { x: 500, y: 500 },
            { x: 900, y: 500 },
            1000
          );
          toast.info('FAR (quiet)');
        }, 1800);
        setCalibrationTests(prev => ({ ...prev, distance: true }));
        break;
        
      case 'pitch':
        // Play high (above), then low (below)
        setTimeout(() => {
          audioEngine.playPing(
            { x: 500, y: 500 },
            { x: 500, y: 100 },
            1000
          );
          toast.info('ABOVE (high pitch)');
        }, 100);
        setTimeout(() => {
          audioEngine.playPing(
            { x: 500, y: 500 },
            { x: 500, y: 900 },
            1000
          );
          toast.info('BELOW (low pitch)');
        }, 1800);
        setCalibrationTests(prev => ({ ...prev, pitch: true }));
        break;
        
      case 'spatial3D':
        // Test true 3D positioning: front-left → back-right → above → below
        setTimeout(() => {
          audioEngine.playPing(
            { x: 500, y: 500 },
            { x: 200, y: 300 },  // Front-left
            1000
          );
          toast.info('FRONT-LEFT');
        }, 100);
        setTimeout(() => {
          audioEngine.playPing(
            { x: 500, y: 500 },
            { x: 800, y: 700 },  // Back-right
            1000
          );
          toast.info('BACK-RIGHT');
        }, 1600);
        setTimeout(() => {
          audioEngine.playPing(
            { x: 500, y: 500 },
            { x: 500, y: 100 },  // Above
            1000
          );
          toast.info('ABOVE');
        }, 3100);
        setTimeout(() => {
          audioEngine.playPing(
            { x: 500, y: 500 },
            { x: 500, y: 900 },  // Below
            1000
          );
          toast.info('BELOW');
        }, 4600);
        setCalibrationTests(prev => ({ ...prev, spatial3D: true }));
        break;
    }
  };

  const handleCheatCodeSubmit = () => {
    if (!cheatCodeInput.trim()) return;
    
    const success = activateCheat(cheatCodeInput);
    if (success) {
      toast.success(`Cheat activated: ${cheatCodeInput}`, {
        description: 'All chapters unlocked! 🎮',
        duration: 3000,
      });
      setCheatCodeInput('');
      setActiveCheats(getActiveCheats());
    } else {
      toast.error('Invalid code', {
        description: 'Try UNLOCK_ALL to unlock all chapters',
        duration: 2500,
      });
    }
  };

  const handleDeactivateCheat = (code: string) => {
    deactivateCheat(code);
    setActiveCheats(getActiveCheats());
    toast.info('Cheat deactivated', {
      description: 'Chapter progression restored to normal',
    });
  };

  const allTestsComplete = Object.values(calibrationTests).every(test => test);

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
          <h1 className="text-heading-2">Settings</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Settings */}
      <div className="max-w-2xl mx-auto p-6 space-y-8 py-12">
        {/* Audio */}
        <section className="space-y-4">
          <h2 className="text-heading-3">Audio</h2>
          
          <div className="flat-card space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base">
                <Volume2 className="w-4 h-4" />
                Volume
              </Label>
              <span className="text-heading-3 font-mono">{volume[0]}%</span>
            </div>
            <Slider
              value={volume}
              onValueChange={setVolume}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="flat-card space-y-4">
            <div>
              <Label className="text-base">Sound Theme</Label>
              <p className="text-xs text-muted-foreground mt-1">
                All themes use the same <strong>binaural 3D positioning</strong>. Choose based on your preferred sound character.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {AUDIO_THEMES.map(t => (
                <div
                  key={t.id}
                  className={`relative p-3 rounded-xl border-2 transition-all ${
                    audioTheme === t.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <button
                    onClick={() => setAudioTheme(t.id)}
                    className="w-full text-left pr-10"
                  >
                    <p className="text-small font-semibold">{t.name}</p>
                    <p className="text-tiny text-muted-foreground">{t.description}</p>
                  </button>
                  
                  {/* Preview button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audioEngine.initialize();
                      audioEngine.playPreview(t.id);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-primary/20 hover:bg-primary/40 flex items-center justify-center text-primary transition-all hover-lift"
                    aria-label={`Preview ${t.name}`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Audio Setup Guide */}
        <section className="space-y-4">
          <div>
            <h2 className="text-heading-3 mb-2 flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              Audio Setup Guide
            </h2>
            <p className="text-small text-muted-foreground">
              Optimize your audio experience for true binaural 3D sound. After setup, complete the calibration tests below to verify everything works correctly.
            </p>
          </div>
          
          <div className="space-y-3">
            {/* Headphones Required */}
            <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-primary mb-1">Use Headphones (Required)</p>
                <p className="text-xs text-muted-foreground">
                  This game uses <strong>binaural 3D audio with HRTF</strong> to create realistic spatial positioning. 
                  Regular stereo headphones or earbuds work perfectly. Speakers will not provide the 3D audio effect.
                </p>
              </div>
            </div>
            
            {/* Disable System Spatial Audio */}
            <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-destructive mb-1">Disable System Spatial Audio Features</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Turn off Windows Sonic, Dolby Atmos, or Apple Spatial Audio. These features are designed 
                  for surround sound content and will interfere with the game's precise directional cues.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground bg-background/50 rounded p-3">
                  <div>
                    <p className="font-semibold text-foreground">Windows:</p>
                    <p className="font-mono text-[10px] leading-relaxed">
                      Settings → System → Sound → [Your Device] → Properties → Set Spatial Sound to "Off"
                    </p>
                  </div>
                  <div className="border-t border-border/50 pt-2">
                    <p className="font-semibold text-foreground">Mac/iOS with AirPods:</p>
                    <p className="font-mono text-[10px] leading-relaxed">
                      Control Center → Click AirPods → Set Spatial Audio to "Off"
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quiet Environment */}
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border">
              <span className="text-2xl">🤫</span>
              <div>
                <p className="font-semibold mb-1">Play in a Quiet Environment</p>
                <p className="text-xs text-muted-foreground">
                  Binaural audio relies on subtle cues. Background noise can mask important directional 
                  information. Find a quiet space for the best experience.
                </p>
              </div>
            </div>
            
            {/* Volume Sweet Spot */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border">
            <Volume2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
                <p className="font-semibold mb-1">Find Your Volume Sweet Spot</p>
                <p className="text-xs text-muted-foreground">
                  Adjust the volume slider at the top of this page to a comfortable level. You should hear pitch changes, 
                  stereo positioning, and subtle distance variations clearly without straining.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Audio Calibration */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-heading-3">Audio Calibration Tests</h2>
            {allTestsComplete && (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            )}
          </div>
          
          <div className="flat-card space-y-4">
            <div className="flex items-start gap-3">
              <Headphones className="w-5 h-5 mt-1 text-primary" />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-small font-medium">Test your audio setup</p>
                  <p className="text-tiny text-muted-foreground">
                    Verify that binaural 3D audio is working correctly with your headphones
                  </p>
                </div>

                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runCalibrationTest('leftRight')}
                    className="justify-start"
                  >
                    {calibrationTests.leftRight && (
                      <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                    )}
                    <span className="flex-1 text-left">Left/Right Channel Test</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runCalibrationTest('distance')}
                    className="justify-start"
                  >
                    {calibrationTests.distance && (
                      <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                    )}
                    <span className="flex-1 text-left">Distance Test (Volume)</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runCalibrationTest('pitch')}
                    className="justify-start"
                  >
                    {calibrationTests.pitch && (
                      <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                    )}
                    <span className="flex-1 text-left">Vertical Position (Pitch)</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runCalibrationTest('spatial3D')}
                    className="justify-start"
                  >
                    {calibrationTests.spatial3D && (
                      <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                    )}
                    <span className="flex-1 text-left">3D Positioning Test</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      Front, Back, Above, Below
                    </span>
                  </Button>
                </div>

                {allTestsComplete && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-small text-primary font-medium">
                      ✓ All tests complete! Your audio is calibrated.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-4">
          <h2 className="text-heading-3">Appearance</h2>
          
          <div className="flat-card flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-base">
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                Theme
              </Label>
              <p className="text-small text-muted-foreground">
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>

          <div className="flat-card flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Reduce Motion</Label>
              <p className="text-small text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
            />
          </div>
        </section>

        {/* Tutorial Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-heading-3">Tutorial</h2>
            <p className="text-muted-foreground">
              Reset your tutorial progress to see the introduction again
            </p>
          </div>

          <div className="flat-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Reset Tutorial</p>
                <p className="text-xs text-muted-foreground">
                  Clear tutorial completion status and restart from the beginning
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetTutorial();
                  toast.success('Tutorial reset! Visit "How to Play" to start over.');
                }}
              >
                Reset Tutorial
              </Button>
            </div>
          </div>
        </section>

        {/* Cheat Codes Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-heading-3">Cheat Codes</h2>
              <p className="text-muted-foreground">
                Classic game codes for testing and exploration
              </p>
            </div>
          </div>

          <div className="flat-card space-y-4">
            {/* Code Input */}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter code (e.g., UNLOCK_ALL)..."
                value={cheatCodeInput}
                onChange={(e) => setCheatCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCheatCodeSubmit();
                  }
                }}
                className="font-mono flex-1"
              />
              <Button 
                onClick={handleCheatCodeSubmit}
                disabled={!cheatCodeInput.trim()}
              >
                Activate
              </Button>
            </div>

            {/* Active Cheats Display */}
            {activeCheats.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Active Cheats:</Label>
                {activeCheats.map((cheat) => (
                  <div
                    key={cheat.code}
                    className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{cheat.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cheat.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeactivateCheat(cheat.code)}
                      className="text-xs shrink-0 ml-2"
                    >
                      Deactivate
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No active cheats. Try entering "UNLOCK_ALL" to unlock all chapters for testing.
              </p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
