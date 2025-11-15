import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Github, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Credits() {
  const navigate = useNavigate();

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
          <h1 className="text-heading-2">Credits</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6 space-y-12 py-12">
        <div className="text-center space-y-4">
          <h2 className="text-display font-display">
            echo<span className="text-primary">)))</span>location
          </h2>
          <p className="text-muted-foreground">
            An audio-first browser game about finding hidden boxes using sound
          </p>
        </div>

        <div className="flat-card space-y-6">
          <div className="space-y-2">
            <h3 className="text-heading-3">Built With</h3>
            <ul className="text-small text-muted-foreground space-y-1">
              <li>• React 18 + TypeScript</li>
              <li>• Vite + TailwindCSS</li>
              <li>• shadcn/ui + Radix UI</li>
              <li>• Web Audio API</li>
              <li>• Framer Motion</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-heading-3">Design</h3>
            <p className="text-small text-muted-foreground">
              Following the ECHOLOCATION design system with geometric minimalism and echo-inspired interactions
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-heading-3">Sound Design</h3>
            <p className="text-small text-muted-foreground">
              Procedurally generated audio using oscillators with spatial positioning
            </p>
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Heart className="w-4 h-4 text-accent" />
            <p className="text-small">Made with Lovable</p>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <button className="ghost-button p-2">
              <Github className="w-5 h-5" />
            </button>
            <button className="ghost-button p-2">
              <Twitter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-tiny text-muted-foreground">
            v1.0.0 • 2025
          </p>
        </div>
      </div>
    </div>
  );
}
