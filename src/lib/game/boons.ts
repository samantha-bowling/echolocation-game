import { isCheatActive } from './cheats';

export interface Boon {
  id: string;
  name: string;
  description: string;
  unlockChapter: number;
  icon: string;
  effect: BoonEffect;
}

export interface BoonEffect {
  extraPings?: number;
  proximityMultiplier?: number;
  radiusMultiplier?: number;
  timePenaltyMultiplier?: number;
  extraReplays?: number;
  phantomVisibility?: boolean;
  showTrail?: boolean;
}

export type BoonArchetype = 'precision' | 'efficiency' | 'adaptability';

export const BOONS: Boon[] = [
  // ===== PRECISION ARCHETYPE =====
  {
    id: 'sharper_ears',
    name: 'Sharper Ears',
    description: 'Increase proximity detection range by 15%',
    unlockChapter: 1,
    icon: 'Ear',
    effect: { proximityMultiplier: 1.15 },
  },
  {
    id: 'wide_net',
    name: 'Wide Net',
    description: 'Success radius increased by 20%',
    unlockChapter: 1,
    icon: 'Target',
    effect: { radiusMultiplier: 1.2 },
  },
  {
    id: 'perfect_pitch',
    name: 'Perfect Pitch',
    description: 'Audio clarity increased, easier to judge vertical distance',
    unlockChapter: 1,
    icon: 'Music',
    effect: { proximityMultiplier: 1.1, radiusMultiplier: 1.1 },
  },
  {
    id: 'keen_focus',
    name: 'Keen Focus',
    description: 'Gain +1 ping and 10% better accuracy',
    unlockChapter: 1,
    icon: 'Crosshair',
    effect: { extraPings: 1, radiusMultiplier: 1.1 },
  },
  {
    id: 'steady_hand',
    name: 'Steady Hand',
    description: 'Final guess placement is 25% more forgiving',
    unlockChapter: 1,
    icon: 'Hand',
    effect: { radiusMultiplier: 1.25 },
  },

  // ===== EFFICIENCY ARCHETYPE =====
  {
    id: 'quick_echo',
    name: 'Quick Echo',
    description: 'Reduce time penalty by 40%',
    unlockChapter: 1,
    icon: 'Zap',
    effect: { timePenaltyMultiplier: 0.6 },
  },
  {
    id: 'conservation',
    name: 'Conservation',
    description: 'Gain +2 pings for careful planning',
    unlockChapter: 1,
    icon: 'Battery',
    effect: { extraPings: 2 },
  },
  {
    id: 'second_wind',
    name: 'Second Wind',
    description: 'No time penalty at all, take your time',
    unlockChapter: 1,
    icon: 'Timer',
    effect: { timePenaltyMultiplier: 0 },
  },
  {
    id: 'echo_memory',
    name: 'Echo Memory',
    description: 'Gain 3 ping replays to review your echoes',
    unlockChapter: 1,
    icon: 'RotateCcw',
    effect: { extraReplays: 3 },
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Time penalty reduced by 60%, but lose 1 ping',
    unlockChapter: 1,
    icon: 'Rocket',
    effect: { extraPings: -1, timePenaltyMultiplier: 0.4 },
  },

  // ===== ADAPTABILITY ARCHETYPE =====
  {
    id: 'phantom_sight',
    name: 'Phantom Sight',
    description: 'Phantom targets become slightly translucent',
    unlockChapter: 1,
    icon: 'Eye',
    effect: { phantomVisibility: true },
  },
  {
    id: 'motion_tracker',
    name: 'Motion Tracker',
    description: 'Moving targets leave a faint trail',
    unlockChapter: 1,
    icon: 'Move',
    effect: { showTrail: true },
  },
  {
    id: 'beginners_luck',
    name: "Beginner's Luck",
    description: 'Success radius increased by 30% for shrinking targets',
    unlockChapter: 1,
    icon: 'Sparkles',
    effect: { radiusMultiplier: 1.3 },
  },
  {
    id: 'safety_net',
    name: 'Safety Net',
    description: 'Gain 2 replays and 15% better accuracy',
    unlockChapter: 1,
    icon: 'Shield',
    effect: { extraReplays: 2, radiusMultiplier: 1.15 },
  },
  {
    id: 'risk_reward',
    name: 'Risk & Reward',
    description: 'Gain +2 pings but lose all replays',
    unlockChapter: 1,
    icon: 'Dice6',
    effect: { extraPings: 2, extraReplays: -999 },
  },
];

export function getBoonById(id: string): Boon | undefined {
  return BOONS.find(b => b.id === id);
}

export function getUnlockedBoons(completedChapters: number[]): Boon[] {
  // Check if UNLOCK_ALL_BOONS cheat is active
  if (isCheatActive('UNLOCK_ALL_BOONS')) {
    return [...BOONS];
  }
  
  return BOONS.filter(b => completedChapters.includes(b.unlockChapter));
}

export function getBoonsByArchetype(archetype: BoonArchetype): Boon[] {
  const archetypeMap: Record<BoonArchetype, string[]> = {
    precision: ['sharper_ears', 'wide_net', 'perfect_pitch', 'keen_focus', 'steady_hand'],
    efficiency: ['quick_echo', 'conservation', 'second_wind', 'echo_memory', 'speed_demon'],
    adaptability: ['phantom_sight', 'motion_tracker', 'beginners_luck', 'safety_net', 'risk_reward'],
  };
  return BOONS.filter(b => archetypeMap[archetype].includes(b.id));
}

export function getRandomBoonByArchetype(archetype: BoonArchetype, excludeIds: string[] = []): Boon {
  const available = getBoonsByArchetype(archetype).filter(b => !excludeIds.includes(b.id));
  return available[Math.floor(Math.random() * available.length)];
}

export function applyBoonEffects(
  basePings: number,
  baseReplays: number | undefined,
  activeBoons: string[]
): {
  pings: number;
  replays: number | undefined;
  proximityMultiplier: number;
  radiusMultiplier: number;
  timePenaltyMultiplier: number;
  phantomVisibility: boolean;
  showTrail: boolean;
} {
  let pings = basePings;
  let replays = baseReplays;
  let proximityMultiplier = 1;
  let radiusMultiplier = 1;
  let timePenaltyMultiplier = 1;
  let phantomVisibility = false;
  let showTrail = false;
  
  activeBoons.forEach(boonId => {
    const boon = BOONS.find(b => b.id === boonId);
    if (!boon) return;
    
    if (boon.effect.extraPings) pings = Math.max(1, pings + boon.effect.extraPings);
    if (boon.effect.extraReplays && replays !== undefined && replays !== -1) {
      replays = Math.max(0, replays + boon.effect.extraReplays);
    }
    if (boon.effect.proximityMultiplier) proximityMultiplier *= boon.effect.proximityMultiplier;
    if (boon.effect.radiusMultiplier) radiusMultiplier *= boon.effect.radiusMultiplier;
    if (boon.effect.timePenaltyMultiplier) timePenaltyMultiplier *= boon.effect.timePenaltyMultiplier;
    if (boon.effect.phantomVisibility) phantomVisibility = true;
    if (boon.effect.showTrail) showTrail = true;
  });
  
  return { pings, replays, proximityMultiplier, radiusMultiplier, timePenaltyMultiplier, phantomVisibility, showTrail };
}
