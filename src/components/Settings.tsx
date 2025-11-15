import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { audioEngine, AUDIO_THEMES } from '@/lib/audio/engine';
import { useTheme } from 'next-themes';

export function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  const [volume, setVolume] = useState([70]);
  const [audioTheme, setAudioTheme] = useState('sonar');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [hardMode, setHardMode] = useState(false);

  useEffect(() => {
    audioEngine.setVolume(volume[0] / 100);
  }, [volume]);

  useEffect(() => {
    audioEngine.setTheme(audioTheme);
  }, [audioTheme]);

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
                <button
                  key={t.id}
                  onClick={() => setAudioTheme(t.id)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    audioTheme === t.id
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

        {/* Gameplay */}
        <section className="space-y-4">
          <h2 className="text-heading-3">Gameplay</h2>
          
          <div className="flat-card flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Show Hints</Label>
              <p className="text-small text-muted-foreground">
                Display helpful visual cues
              </p>
            </div>
            <Switch
              checked={showHints}
              onCheckedChange={setShowHints}
            />
          </div>

          <div className="flat-card flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Hard Mode</Label>
              <p className="text-small text-muted-foreground">
                Smaller success radius, no hints
              </p>
            </div>
            <Switch
              checked={hardMode}
              onCheckedChange={setHardMode}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
