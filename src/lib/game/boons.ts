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
}

export const BOONS: Boon[] = [
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
    unlockChapter: 2,
    icon: 'Target',
    effect: { radiusMultiplier: 1.2 },
  },
  {
    id: 'echo_memory',
    name: 'Echo Memory',
    description: 'Gain +2 extra replay uses per round',
    unlockChapter: 3,
    icon: 'RotateCcw',
    effect: { extraReplays: 2 },
  },
  {
    id: 'phantom_sight',
    name: 'Phantom Sight',
    description: 'Phantom targets become slightly translucent',
    unlockChapter: 4,
    icon: 'Eye',
    effect: { phantomVisibility: true },
  },
  {
    id: 'master_sonar',
    name: 'Master Sonar',
    description: 'Gain +1 ping and reduce time penalty by 50%',
    unlockChapter: 5,
    icon: 'Zap',
    effect: { extraPings: 1, timePenaltyMultiplier: 0.5 },
  },
];

export function getBoonById(id: string): Boon | undefined {
  return BOONS.find(b => b.id === id);
}

export function getUnlockedBoons(completedChapters: number[]): Boon[] {
  return BOONS.filter(b => completedChapters.includes(b.unlockChapter));
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
} {
  let pings = basePings;
  let replays = baseReplays;
  let proximityMultiplier = 1;
  let radiusMultiplier = 1;
  let timePenaltyMultiplier = 1;
  let phantomVisibility = false;
  
  activeBoons.forEach(boonId => {
    const boon = BOONS.find(b => b.id === boonId);
    if (!boon) return;
    
    if (boon.effect.extraPings) pings += boon.effect.extraPings;
    if (boon.effect.extraReplays && replays !== undefined) replays += boon.effect.extraReplays;
    if (boon.effect.proximityMultiplier) proximityMultiplier *= boon.effect.proximityMultiplier;
    if (boon.effect.radiusMultiplier) radiusMultiplier *= boon.effect.radiusMultiplier;
    if (boon.effect.timePenaltyMultiplier) timePenaltyMultiplier *= boon.effect.timePenaltyMultiplier;
    if (boon.effect.phantomVisibility) phantomVisibility = true;
  });
  
  return { pings, replays, proximityMultiplier, radiusMultiplier, timePenaltyMultiplier, phantomVisibility };
}
