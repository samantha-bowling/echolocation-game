export interface CheatCode {
  code: string;
  name: string;
  description: string;
  category: 'progression' | 'gameplay' | 'debug' | 'meta';
  special?: boolean;
}

export const CHEAT_CODES: CheatCode[] = [
  {
    code: 'UP_UP_DOWN_DOWN_LEFT_RIGHT_LEFT_RIGHT_B_A_START',
    name: 'Cheat Code Reference',
    description: 'View all available cheat codes',
    category: 'meta',
    special: true,
  },
  {
    code: 'UNLOCK_ALL',
    name: 'Unlock All Chapters',
    description: 'Unlock all 5 chapters for immediate access',
    category: 'progression',
  },
  {
    code: 'UNLOCK_ALL_BOONS',
    name: 'Unlock All Boons',
    description: 'Unlock all 15 boons for selection in any chapter',
    category: 'progression',
  },
  {
    code: 'SWAP_BOONS',
    name: 'Unlimited Boon Swapping',
    description: 'Change your active boon at any time during gameplay',
    category: 'gameplay',
  },
  {
    code: 'REVEAL_TARGET',
    name: 'Target Hint',
    description: 'Show a subtle visual hint at the target location (Chapters 2-3 only)',
    category: 'debug',
  },
];

export function activateCheat(code: string): boolean {
  const normalizedCode = code.toUpperCase().trim();
  const cheat = CHEAT_CODES.find(c => c.code === normalizedCode);
  
  if (cheat) {
    localStorage.setItem(`echo_cheat_${normalizedCode.toLowerCase()}`, 'true');
    return true;
  }
  return false;
}

export function deactivateCheat(code: string): void {
  const normalizedCode = code.toUpperCase().trim();
  localStorage.removeItem(`echo_cheat_${normalizedCode.toLowerCase()}`);
}

export function isCheatActive(code: string): boolean {
  const normalizedCode = code.toUpperCase().trim();
  return localStorage.getItem(`echo_cheat_${normalizedCode.toLowerCase()}`) === 'true';
}

export function getActiveCheats(): CheatCode[] {
  return CHEAT_CODES.filter(cheat => isCheatActive(cheat.code));
}

export function getAllCheats(): CheatCode[] {
  return CHEAT_CODES;
}
