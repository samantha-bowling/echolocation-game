export interface Boon {
  id: string;
  name: string;
  description: string;
  unlockScore: number;
  icon: string;
}

export const BOONS: Boon[] = [
  {
    id: 'second_wind',
    name: 'Second Wind',
    description: 'Gain +1 extra ping per round',
    unlockScore: 1500,
    icon: 'Plus',
  },
  {
    id: 'sharper_ears',
    name: 'Sharper Ears',
    description: 'Increase proximity detection range by 15%',
    unlockScore: 2000,
    icon: 'Ear',
  },
  {
    id: 'wide_net',
    name: 'Wide Net',
    description: 'Success radius increased by 20%',
    unlockScore: 2500,
    icon: 'Target',
  },
  {
    id: 'echo_delay',
    name: 'Echo Delay',
    description: 'Each ping plays a faint second echo',
    unlockScore: 3000,
    icon: 'Radio',
  },
  {
    id: 'ghost_step',
    name: 'Ghost Step',
    description: 'Reduce time penalty by 50%',
    unlockScore: 3500,
    icon: 'Ghost',
  },
];

export function getBoonById(id: string): Boon | undefined {
  return BOONS.find(b => b.id === id);
}

export function getUnlockedBoons(bestScore: number): Boon[] {
  return BOONS.filter(b => bestScore >= b.unlockScore);
}

export function applyBoonEffects(basePings: number, activeBoons: string[]): {
  pings: number;
  proximityMultiplier: number;
  radiusMultiplier: number;
  timePenaltyMultiplier: number;
} {
  let pings = basePings;
  let proximityMultiplier = 1;
  let radiusMultiplier = 1;
  let timePenaltyMultiplier = 1;
  
  if (activeBoons.includes('second_wind')) pings += 1;
  if (activeBoons.includes('sharper_ears')) proximityMultiplier = 1.15;
  if (activeBoons.includes('wide_net')) radiusMultiplier = 1.2;
  if (activeBoons.includes('ghost_step')) timePenaltyMultiplier = 0.5;
  
  return { pings, proximityMultiplier, radiusMultiplier, timePenaltyMultiplier };
}
