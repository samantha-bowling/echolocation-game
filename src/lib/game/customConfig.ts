export interface CustomGameConfig {
  // Pings
  pingsMode: 'limited' | 'unlimited';
  pingsCount: number;
  showPingLocations: boolean; // Show visual ping markers
  
  // Ping Replays
  pingReplaysEnabled: boolean;
  replaysCount: number;
  
  // Target
  targetSize: number;
  movementMode: 'static' | 'after-pings';
  movementTrigger?: number;
  
  // Gameplay
  timerEnabled: boolean;
  
  // Audio
  theme: string;
  noiseLevel: number;
  decoys: boolean;
  
  // Arena
  arenaSize: 'small' | 'medium' | 'large';

  // Win Condition
  winCondition?: {
    type: 'none' | 'proximity';
    proximityThreshold?: number;
  };

  // Rounds: number (1-100) or -1 for unlimited "cozy mode"
  numberOfRounds: number;

  // Hints
  hintsEnabled: boolean;
  hintLevel: 'basic' | 'detailed';
}

export const DEFAULT_CUSTOM_CONFIG: CustomGameConfig = {
  pingsMode: 'limited',
  pingsCount: 5,
  showPingLocations: true,
  pingReplaysEnabled: false,
  replaysCount: 0,
  targetSize: 100,
  movementMode: 'static',
  movementTrigger: 3,
  timerEnabled: true,
  theme: 'sonar',
  noiseLevel: 0,
  decoys: false,
  arenaSize: 'medium',
  winCondition: {
    type: 'none',
  },
  numberOfRounds: 1,
  hintsEnabled: false,
  hintLevel: 'basic',
};

export const ARENA_PRESETS = {
  small: { width: 600, height: 450, label: 'Small (600×450)' },
  medium: { width: 800, height: 600, label: 'Medium (800×600)' },
  large: { width: 1000, height: 750, label: 'Large (1000×750)' },
} as const;

export function getArenaDimensions(size: CustomGameConfig['arenaSize']) {
  return ARENA_PRESETS[size];
}

export function validateCustomConfig(config: CustomGameConfig): CustomGameConfig {
  return {
    ...config,
    pingsCount: Math.max(1, Math.min(999, config.pingsCount)),
    targetSize: Math.max(30, Math.min(200, config.targetSize)),
    movementTrigger: config.movementMode === 'after-pings' 
      ? Math.max(2, Math.min(config.pingsCount - 1, config.movementTrigger || 3))
      : undefined,
    noiseLevel: Math.max(0, Math.min(100, config.noiseLevel)),
  };
}

// Preset management
export interface CustomPreset {
  name: string;
  config: CustomGameConfig;
  createdAt: string;
}

const PRESETS_STORAGE_KEY = 'echomaster-custom-presets';

export function saveCustomPreset(name: string, config: CustomGameConfig): void {
  const presets = loadCustomPresets();
  const preset: CustomPreset = {
    name,
    config: validateCustomConfig(config),
    createdAt: new Date().toISOString(),
  };
  presets[name] = preset;
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
}

export function loadCustomPresets(): Record<string, CustomPreset> {
  try {
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function deleteCustomPreset(name: string): void {
  const presets = loadCustomPresets();
  delete presets[name];
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
}

export function getPresetNames(): string[] {
  return Object.keys(loadCustomPresets());
}

// Share code encoding/decoding
import { encode as base64Encode, decode as base64Decode } from 'js-base64';

export function encodeConfigToShareCode(config: CustomGameConfig): string {
  try {
    const compact = {
      p: config.pingsMode === 'unlimited' ? -1 : config.pingsCount,
      pl: config.showPingLocations ? 1 : 0,
      re: config.pingReplaysEnabled ? 1 : 0,
      rc: config.replaysCount,
      t: config.timerEnabled ? 1 : 0,
      m: config.movementMode === 'static' ? 0 : config.movementTrigger,
      a: config.arenaSize === 'small' ? 0 : config.arenaSize === 'medium' ? 1 : 2,
      s: config.targetSize,
      n: config.numberOfRounds,
      h: config.hintsEnabled ? 1 : 0,
      hl: config.hintLevel === 'basic' ? 0 : 1,
      wc: config.winCondition?.type || 'none',
      wt: config.winCondition?.proximityThreshold || 80,
      d: config.decoys ? 1 : 0,
      nl: config.noiseLevel,
      th: config.theme,
    };
    
    const json = JSON.stringify(compact);
    const encoded = base64Encode(json);
    return `ECHO-${encoded}`;
  } catch (e) {
    console.error('Failed to encode config:', e);
    return '';
  }
}

export function decodeShareCodeToConfig(shareCode: string): CustomGameConfig | null {
  try {
    if (!shareCode.startsWith('ECHO-')) {
      throw new Error('Invalid share code format');
    }
    
    const encoded = shareCode.substring(5);
    const json = base64Decode(encoded);
    const compact = JSON.parse(json);
    
    const config: CustomGameConfig = {
      pingsMode: compact.p === -1 ? 'unlimited' : 'limited',
      pingsCount: compact.p === -1 ? DEFAULT_CUSTOM_CONFIG.pingsCount : compact.p,
      showPingLocations: compact.pl === 1,
      pingReplaysEnabled: compact.re === 1,
      replaysCount: compact.rc ?? 0,
      timerEnabled: compact.t === 1,
      movementMode: compact.m === 0 ? 'static' : 'after-pings',
      movementTrigger: compact.m === 0 ? DEFAULT_CUSTOM_CONFIG.movementTrigger : compact.m,
      arenaSize: compact.a === 0 ? 'small' : compact.a === 1 ? 'medium' : 'large',
      targetSize: compact.s,
      numberOfRounds: compact.n ?? 1,
      hintsEnabled: compact.h === 1,
      hintLevel: compact.hl === 0 ? 'basic' : 'detailed',
      winCondition: compact.wc === 'none' ? { type: 'none' } : {
        type: compact.wc,
        proximityThreshold: compact.wt,
      },
      decoys: compact.d === 1,
      noiseLevel: compact.nl,
      theme: compact.th,
    };
    
    return validateCustomConfig(config);
  } catch (e) {
    console.error('Failed to decode share code:', e);
    return null;
  }
}
