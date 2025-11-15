export interface CustomGameConfig {
  // Pings
  pingsMode: 'limited' | 'unlimited';
  pingsCount: number;
  
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
  
  // Arena (for future use)
  arenaSize: 'small' | 'medium' | 'large';
}

export const DEFAULT_CUSTOM_CONFIG: CustomGameConfig = {
  pingsMode: 'limited',
  pingsCount: 5,
  targetSize: 100,
  movementMode: 'static',
  movementTrigger: 3,
  timerEnabled: true,
  theme: 'sonar',
  noiseLevel: 0,
  decoys: false,
  arenaSize: 'medium',
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
