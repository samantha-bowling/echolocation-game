import { Position } from '../game/coords';
import { getDirection } from '../game/distance';

export interface AudioTheme {
  id: string;
  name: string;
  baseFrequency: number;
  waveform: OscillatorType;
  description: string;
  // Enhancement properties
  filterEnabled?: boolean;
  filterFrequency?: number;
  filterSweep?: number;
  detuneAmount?: number;
  tremoloEnabled?: boolean;
  tremoloRate?: number;
  noiseAmount?: number;
  frequencySweepMultiplier?: number; // For dolphin chirp effect
}

export const AUDIO_THEMES: AudioTheme[] = [
  {
    id: 'sonar',
    name: 'Classic Sonar',
    baseFrequency: 440,
    waveform: 'sine',
    description: 'Clean underwater sweep',
    filterEnabled: true,
    filterFrequency: 800,
    filterSweep: 400,
  },
  {
    id: 'submarine',
    name: 'Submarine Sonar',
    baseFrequency: 220,
    waveform: 'sine',
    description: 'Deep bass pulse',
    filterEnabled: true,
    filterFrequency: 600,
    filterSweep: 300,
  },
  {
    id: 'scifi',
    name: 'Sci-Fi Pulse',
    baseFrequency: 330,
    waveform: 'sawtooth',
    description: 'Synthetic shimmer',
    detuneAmount: 15,
  },
  {
    id: 'dolphin',
    name: 'Dolphin Chirp',
    baseFrequency: 800,
    waveform: 'sine',
    description: 'Natural frequency sweep',
    frequencySweepMultiplier: 1.5, // Sweeps from 800Hz to 1200Hz
  },
];

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentTheme: AudioTheme = AUDIO_THEMES[0];
  private volume: number = 0.7;
  private canvasWidth: number = 1000;
  private canvasHeight: number = 1000;

  initialize(canvasWidth: number = 1000, canvasHeight: number = 1000) {
    if (this.context) return;
    
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.value = this.volume;
    
    // Store canvas dimensions for 3D coordinate mapping
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Set up listener position (user's "ears" in 3D space)
    if (this.context.listener.positionX) {
      // Modern API
      this.context.listener.positionX.value = 0;
      this.context.listener.positionY.value = 0;
      this.context.listener.positionZ.value = 0;
      this.context.listener.forwardX.value = 0;
      this.context.listener.forwardY.value = 0;
      this.context.listener.forwardZ.value = -1;  // Looking into the screen
      this.context.listener.upX.value = 0;
      this.context.listener.upY.value = 1;
      this.context.listener.upZ.value = 0;
    } else {
      // Fallback for older browsers
      this.context.listener.setPosition(0, 0, 0);
      this.context.listener.setOrientation(0, 0, -1, 0, 1, 0);
    }
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
   * Play ping sound with true binaural 3D audio (HRTF)
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
    
    // Map 2D canvas coordinates to 3D space
    // X: -1 to 1 (left to right) scaled to -10 to 10
    // Y: -1 to 1 (top to bottom, inverted for audio space) scaled to -5 to 5
    // Z: Based on distance (0 to -10, closer = towards listener)
    const targetX = ((targetPosition.x / this.canvasWidth) * 2 - 1) * 10;
    const targetY = ((targetPosition.y / this.canvasHeight) * -2 + 1) * 5;
    const targetZ = -normalizedDistance * 10;
    
    // Create oscillator
    const oscillator = this.context.createOscillator();
    oscillator.type = this.currentTheme.waveform;
    
    // Pitch modifier - enhanced for Z-axis depth perception
    const pitchModifier = 1 + (direction.verticalRatio * 0.1) + (normalizedDistance * 0.05);
    const baseFreq = this.currentTheme.baseFrequency * pitchModifier;
    oscillator.frequency.value = baseFreq;
    
    // Apply frequency sweep for dolphin theme
    if (this.currentTheme.frequencySweepMultiplier) {
      const now = this.context.currentTime;
      oscillator.frequency.setValueAtTime(baseFreq, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        baseFreq * this.currentTheme.frequencySweepMultiplier,
        now + 0.5
      );
    }
    
    // Apply detune if theme supports it
    if (this.currentTheme.detuneAmount) {
      oscillator.detune.value = this.currentTheme.detuneAmount;
    }
    
    // Create gain for volume based on distance
    const gainNode = this.context.createGain();
    const volumeByDistance = Math.max(0.1, 1 - normalizedDistance * 0.7);
    gainNode.gain.value = volumeByDistance * (isEcho ? 0.3 : 0.6);
    
    // Apply tremolo if theme supports it
    if (this.currentTheme.tremoloEnabled && this.currentTheme.tremoloRate) {
      const tremolo = this.context.createOscillator();
      const tremoloGain = this.context.createGain();
      tremolo.frequency.value = this.currentTheme.tremoloRate;
      tremoloGain.gain.value = 0.3;
      tremolo.connect(tremoloGain);
      tremoloGain.connect(gainNode.gain);
      tremolo.start();
      tremolo.stop(this.context.currentTime + 0.6);
    }
    
    // Create filter if theme supports it
    let filterNode: BiquadFilterNode | null = null;
    if (this.currentTheme.filterEnabled && this.currentTheme.filterFrequency) {
      filterNode = this.context.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = this.currentTheme.filterFrequency;
      filterNode.Q.value = 5;
    }
    
    // Create PannerNode for true binaural 3D audio with HRTF
    const panner = this.context.createPanner();
    
    // Configure panner for HRTF binaural audio
    panner.panningModel = 'HRTF';  // Use Head-Related Transfer Function
    panner.distanceModel = 'inverse';  // Natural distance falloff
    panner.refDistance = 1;  // Reference distance for volume
    panner.maxDistance = 20;  // Maximum audible distance
    panner.rolloffFactor = 1.5;  // How quickly sound fades with distance
    panner.coneInnerAngle = 360;  // Omnidirectional sound
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0;
    
    // Set 3D position of the sound source
    if (panner.positionX) {
      // Modern API
      panner.positionX.value = targetX;
      panner.positionY.value = targetY;
      panner.positionZ.value = targetZ;
    } else {
      // Fallback for older browsers
      panner.setPosition(targetX, targetY, targetZ);
    }
    
    // Create noise if theme supports it
    let noiseSource: AudioBufferSourceNode | null = null;
    if (this.currentTheme.noiseAmount && !isEcho) {
      const bufferSize = this.context.sampleRate * 0.05;
      const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * this.currentTheme.noiseAmount;
      }
      noiseSource = this.context.createBufferSource();
      noiseSource.buffer = buffer;
      
      const noiseGain = this.context.createGain();
      noiseGain.gain.value = volumeByDistance * 0.5;
      noiseSource.connect(noiseGain);
      noiseGain.connect(panner);
    }
    
    // Connect nodes: oscillator → gain → filter (optional) → panner → master
    oscillator.connect(gainNode);
    if (filterNode) {
      gainNode.connect(filterNode);
      filterNode.connect(panner);
    } else {
      gainNode.connect(panner);
    }
    panner.connect(this.masterGain);
    
    // Play sound with extended duration and natural decay
    const now = this.context.currentTime;
    const baseDuration = isEcho ? 0.4 : 0.6;
    
    // Apply filter sweep if theme supports it
    if (filterNode && this.currentTheme.filterSweep) {
      filterNode.frequency.setValueAtTime(this.currentTheme.filterFrequency!, now);
      filterNode.frequency.exponentialRampToValueAtTime(
        this.currentTheme.filterFrequency! - this.currentTheme.filterSweep,
        now + baseDuration
      );
    }
    
    // Multi-stage decay for natural reverb tail
    oscillator.start(now);
    if (noiseSource) noiseSource.start(now);
    gainNode.gain.setValueAtTime(volumeByDistance * (isEcho ? 0.3 : 0.6), now);
    gainNode.gain.exponentialRampToValueAtTime(0.15, now + baseDuration * 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + baseDuration);
    oscillator.stop(now + baseDuration);
    if (noiseSource) noiseSource.stop(now + 0.05);
    
    // Add echo repetitions for realistic reverberation
    if (!isEcho) {
      const echoCount = 3;
      const reverbMultiplier = 0.5 + (normalizedDistance * 0.5);
      const echoDelay = 0.12 * reverbMultiplier;
      const echoDecay = 0.6;
      
      for (let i = 1; i <= echoCount; i++) {
        const echoOsc = this.context.createOscillator();
        const echoGain = this.context.createGain();
        const echoPanner = this.context.createStereoPanner();
        
        // Slightly lower pitch for each echo (Doppler-like effect)
        echoOsc.type = this.currentTheme.waveform;
        echoOsc.frequency.value = oscillator.frequency.value * (1 - i * 0.02);
        
        // Decreasing volume for each echo
        const echoVolume = volumeByDistance * Math.pow(echoDecay, i) * 0.4;
        echoGain.gain.value = echoVolume;
        
        // Slightly varied stereo position for spatial depth
        echoPanner.pan.value = direction.horizontalRatio * (1 - i * 0.15);
        
        // Connect echo nodes
        echoOsc.connect(echoGain);
        echoGain.connect(echoPanner);
        echoPanner.connect(this.masterGain);
        
        // Play echo with delay and decay
        const echoStart = now + (echoDelay * i);
        const echoDuration = baseDuration * 0.6;
        
        echoOsc.start(echoStart);
        echoGain.gain.exponentialRampToValueAtTime(0.01, echoStart + echoDuration);
        echoOsc.stop(echoStart + echoDuration);
      }
    }
  }

  /**
   * Play preview of current theme
   */
  playPreview(themeId?: string) {
    if (!this.context || !this.masterGain) {
      this.initialize();
    }
    
    if (!this.context || !this.masterGain) return;

    const theme = themeId 
      ? AUDIO_THEMES.find(t => t.id === themeId) || this.currentTheme
      : this.currentTheme;
    
    const baseDuration = 0.8; // Extended from 0.4s
    const now = this.context.currentTime;
    
    // Create main oscillator
    const oscillator = this.context.createOscillator();
    oscillator.type = theme.waveform;
    oscillator.frequency.value = theme.baseFrequency;
    
    // Apply frequency sweep for dolphin theme
    if (theme.frequencySweepMultiplier) {
      oscillator.frequency.setValueAtTime(theme.baseFrequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        theme.baseFrequency * theme.frequencySweepMultiplier,
        now + baseDuration * 0.6
      );
    }
    
    // Apply detune if theme supports it
    if (theme.detuneAmount) {
      oscillator.detune.value = theme.detuneAmount;
    }
    
    const gainNode = this.context.createGain();
    
    // Create filter if theme supports it
    let filterNode: BiquadFilterNode | null = null;
    if (theme.filterEnabled && theme.filterFrequency) {
      filterNode = this.context.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = theme.filterFrequency;
      filterNode.Q.value = 5;
      
      // Apply filter sweep if theme supports it
      if (theme.filterSweep) {
        filterNode.frequency.setValueAtTime(theme.filterFrequency, now);
        filterNode.frequency.exponentialRampToValueAtTime(
          theme.filterFrequency - theme.filterSweep,
          now + baseDuration
        );
      }
    }
    
    // Multi-stage decay envelope for more natural reverb tail
    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + baseDuration * 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + baseDuration);
    
    // Connect nodes
    oscillator.connect(gainNode);
    if (filterNode) {
      gainNode.connect(filterNode);
      filterNode.connect(this.masterGain);
    } else {
      gainNode.connect(this.masterGain);
    }
    
    oscillator.start(now);
    oscillator.stop(now + baseDuration);
    
    // Add echo repetitions for more realistic sonar feel
    const echoCount = 3;
    const echoDelay = 0.15;
    const echoDecay = 0.6;
    
    for (let i = 1; i <= echoCount; i++) {
      const echoOsc = this.context.createOscillator();
      const echoGain = this.context.createGain();
      
      echoOsc.type = theme.waveform;
      // Slightly lower pitch for each echo (Doppler effect)
      const echoFreq = theme.baseFrequency * (1 - i * 0.02);
      echoOsc.frequency.value = echoFreq;
      
      // Apply frequency sweep to echo if dolphin theme
      if (theme.frequencySweepMultiplier) {
        const echoStart = now + (echoDelay * i);
        echoOsc.frequency.setValueAtTime(echoFreq, echoStart);
        echoOsc.frequency.exponentialRampToValueAtTime(
          echoFreq * theme.frequencySweepMultiplier,
          echoStart + baseDuration * 0.5
        );
      }
      
      const echoVolume = 0.5 * Math.pow(echoDecay, i);
      echoGain.gain.setValueAtTime(echoVolume, now + (echoDelay * i));
      
      // Echo filter
      let echoFilter: BiquadFilterNode | null = null;
      if (theme.filterEnabled && theme.filterFrequency) {
        echoFilter = this.context.createBiquadFilter();
        echoFilter.type = 'lowpass';
        echoFilter.frequency.value = theme.filterFrequency;
        echoFilter.Q.value = 5;
      }
      
      echoOsc.connect(echoGain);
      if (echoFilter) {
        echoGain.connect(echoFilter);
        echoFilter.connect(this.masterGain);
      } else {
        echoGain.connect(this.masterGain);
      }
      
      const echoStart = now + (echoDelay * i);
      const echoDuration = baseDuration * 0.7;
      
      echoOsc.start(echoStart);
      echoGain.gain.exponentialRampToValueAtTime(0.01, echoStart + echoDuration);
      echoOsc.stop(echoStart + echoDuration);
    }
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
