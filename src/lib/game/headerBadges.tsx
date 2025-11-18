import { ReactNode } from 'react';
import { Sparkles, Trophy, Zap, Flame } from 'lucide-react';

export interface HeaderBadge {
  id: string;
  type: 'boss' | 'mechanic' | 'achievement' | 'modifier' | 'event';
  priority: number;
  label: string;
  tooltip?: string;
  icon?: ReactNode;
  variant?: 'default' | 'accent' | 'primary' | 'destructive';
}

const mechanicDescriptions: Record<string, string> = {
  shrinking_target: 'Target shrinks after each ping',
  moving_target: 'Target moves after each ping',
  phantom_targets: 'Decoy targets appear',
  combined_challenge: 'All mechanics combined!',
};

export function getHeaderBadges(
  level: number,
  chapter: number,
  specialMechanic?: string,
  // Future parameters (uncomment when needed):
  // achievements?: string[],
  // difficulty?: 'normal' | 'hard' | 'hardcore',
  // activeEvent?: string,
): HeaderBadge[] {
  const badges: HeaderBadge[] = [];

  // Boss Level Badge
  if (level % 10 === 0) {
    badges.push({
      id: 'boss',
      type: 'boss',
      priority: 1,
      label: 'BOSS LEVEL',
      variant: 'accent',
    });
  }

  // Special Mechanic Badge
  if (specialMechanic) {
    badges.push({
      id: 'mechanic',
      type: 'mechanic',
      priority: 2,
      label: 'SPECIAL',
      tooltip: mechanicDescriptions[specialMechanic] || specialMechanic,
      icon: <Sparkles className="w-3 h-3" />,
      variant: 'primary',
    });
  }

  // Future: Achievement Badges
  // if (achievements && achievements.length > 0) {
  //   badges.push({
  //     id: 'achievement',
  //     type: 'achievement',
  //     priority: 3,
  //     label: 'STREAK',
  //     tooltip: 'Perfect score streak active',
  //     icon: <Trophy className="w-3 h-3" />,
  //     variant: 'primary',
  //   });
  // }

  // Future: Difficulty Modifiers
  // if (difficulty === 'hardcore') {
  //   badges.push({
  //     id: 'hardcore',
  //     type: 'modifier',
  //     priority: 4,
  //     label: 'HARDCORE',
  //     tooltip: 'No hints, limited pings',
  //     icon: <Flame className="w-3 h-3" />,
  //     variant: 'destructive',
  //   });
  // }

  // Future: Special Events
  // if (activeEvent) {
  //   badges.push({
  //     id: 'event',
  //     type: 'event',
  //     priority: 5,
  //     label: 'DAILY',
  //     tooltip: 'Daily challenge active',
  //     icon: <Zap className="w-3 h-3" />,
  //     variant: 'accent',
  //   });
  // }

  return badges.sort((a, b) => a.priority - b.priority);
}

export function getBadgeClasses(variant: HeaderBadge['variant'] = 'default'): string {
  const baseClasses = 'text-tiny font-bold px-2 py-0.5 rounded flex items-center gap-1';
  
  switch (variant) {
    case 'accent':
      return `${baseClasses} text-accent bg-accent/20`;
    case 'primary':
      return `${baseClasses} text-primary bg-primary/20`;
    case 'destructive':
      return `${baseClasses} text-destructive bg-destructive/20`;
    default:
      return `${baseClasses} text-foreground bg-secondary/50`;
  }
}
