import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Moon, Sun, Headphones, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { audioEngine, AUDIO_THEMES } from '@/lib/audio/engine';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

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
  });

  useEffect(() => {
    audioEngine.setVolume(volume[0] / 100);
  }, [volume]);

  useEffect(() => {
    audioEngine.setTheme(audioTheme);
  }, [audioTheme]);

  const runCalibrationTest = (testType: 'leftRight' | 'distance' | 'pitch') => {
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
    }
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
            <Label className="text-base">Sound Theme</Label>
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

        {/* Audio Calibration */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-heading-3">Audio Calibration</h2>
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
                    Verify that spatial audio is working correctly with your headphones
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

      </div>
    </div>
  );
}
