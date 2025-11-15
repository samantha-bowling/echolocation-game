import { Position } from '../game/coords';
import { getDirection } from '../game/distance';

export interface AudioTheme {
  id: string;
  name: string;
  baseFrequency: number;
  waveform: OscillatorType;
  description: string;
}

export const AUDIO_THEMES: AudioTheme[] = [
  {
    id: 'sonar',
    name: 'Classic Sonar',
    baseFrequency: 440,
    waveform: 'sine',
    description: 'Clean sine wave ping',
  },
  {
    id: 'arcade',
    name: 'Arcade Beep',
    baseFrequency: 880,
    waveform: 'square',
    description: 'Retro square wave',
  },
  {
    id: 'scifi',
    name: 'Sci-Fi Pulse',
    baseFrequency: 330,
    waveform: 'sawtooth',
    description: 'Futuristic sawtooth',
  },
  {
    id: 'natural',
    name: 'Natural Click',
    baseFrequency: 1200,
    waveform: 'triangle',
    description: 'Organic triangle wave',
  },
];

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentTheme: AudioTheme = AUDIO_THEMES[0];
  private volume: number = 0.7;

  initialize() {
    if (this.context) return;
    
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.value = this.volume;
  }

  setTheme(themeId: string) {
    const theme = AUDIO_THEMES.find(t => t.id === themeId);
    if (theme) {
      this.currentTheme = theme;
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * Play ping sound with spatial audio based on distance and direction
   */
  playPing(
    userPosition: Position,
    targetPosition: Position,
    maxDistance: number,
    isEcho: boolean = false
  ) {
    if (!this.context || !this.masterGain) {
      this.initialize();
    }
    
    if (!this.context || !this.masterGain) return;

    const direction = getDirection(userPosition, targetPosition);
    const normalizedDistance = Math.min(direction.distance / maxDistance, 1);
    
    // Create oscillator
    const oscillator = this.context.createOscillator();
    oscillator.type = this.currentTheme.waveform;
    
    // Pitch varies slightly with vertical position
    const pitchModifier = 1 + (direction.verticalRatio * 0.1);
    oscillator.frequency.value = this.currentTheme.baseFrequency * pitchModifier;
    
    // Create gain for volume based on distance
    const gainNode = this.context.createGain();
    const volumeByDistance = Math.max(0.1, 1 - normalizedDistance * 0.7);
    gainNode.gain.value = volumeByDistance * (isEcho ? 0.3 : 0.6);
    
    // Create panner for stereo positioning
    const panner = this.context.createStereoPanner();
    panner.pan.value = direction.horizontalRatio; // -1 (left) to 1 (right)
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.masterGain);
    
    // Play sound
    const now = this.context.currentTime;
    const duration = isEcho ? 0.15 : 0.2;
    
    oscillator.start(now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    oscillator.stop(now + duration);
  }

  /**
   * Play success sound
   */
  playSuccess() {
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    oscillator.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
    
    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  }

  /**
   * Play failure sound
   */
  playFailure() {
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  cleanup() {
    if (this.context) {
      this.context.close();
      this.context = null;
      this.masterGain = null;
    }
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();
