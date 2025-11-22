import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
            An audio-first browser game about finding hidden targets using sound
          </p>
        </div>

        <div className="flat-card space-y-6">
          <div className="space-y-2">
            <h3 className="text-heading-3">
              Game Concept and Design by{' '}
              <a 
                href="https://samantha-bowling.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              >
                Samantha Bowling
                <span className="text-xs">↗</span>
              </a>
            </h3>
          </div>

          <div className="space-y-2">
            <h3 className="text-heading-3">
              Built With{' '}
              <a 
                href="https://lovable.dev/invite/RFPUQB3" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              >
                Lovable
                <span className="text-xs">↗</span>
              </a>
            </h3>
            <ul className="text-small text-muted-foreground space-y-1">
              <li>• React 18 + TypeScript</li>
              <li>• Vite + TailwindCSS</li>
              <li>• shadcn/ui + Radix UI</li>
              <li>• Web Audio API</li>
              <li>• Framer Motion</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-heading-3">Sound Design</h3>
            <p className="text-small text-muted-foreground">
              Procedurally generated audio using oscillators with spatial positioning
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-heading-3">Feedback & Support</h3>
            <p className="text-small text-muted-foreground">
              Have feedback or found a bug?{' '}
              <a 
                href="mailto:hello@samantha-bowling.com" 
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Send us an email
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <a 
              href="https://funcool.games/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-small text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
            >
              A funcool games project
              <span className="text-xs">↗</span>
            </a>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-border">
          <p className="text-tiny text-muted-foreground">
            © 2025 funcool games. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
