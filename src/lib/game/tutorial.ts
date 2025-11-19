export type TutorialStep = 
  | 'welcome'
  | 'first-ping'
  | 'interpret-sound'
  | 'audio-cues'
  | 'multiple-pings'
  | 'place-guess'
  | 'scoring'
  | 'complete';

export interface TutorialState {
  currentStep: TutorialStep;
  completed: boolean;
  skipped: boolean;
  pingCount: number;
  replaysUsed: number;
}

const TUTORIAL_STORAGE_KEY = 'echo_tutorial_state';
const TUTORIAL_COMPLETED_KEY = 'echo_tutorial_completed';

export const TUTORIAL_STEPS: Record<TutorialStep, {
  title: string;
  description: string;
  action?: string;
}> = {
  welcome: {
    title: 'Welcome to echo)))location!',
    description: 'Find hidden targets using only sound. Headphones recommended for the best experience.',
    action: 'Start Tutorial',
  },
  'first-ping': {
    title: 'Send Your First Ping',
    description: 'Click anywhere on the canvas to send a ping. Listen carefully to the sound - it tells you how close you are to the target.',
    action: 'Continue',
  },
  'interpret-sound': {
    title: 'Reading Audio Cues 👂',
    description: 'Listen carefully! The game uses binaural 3D audio with HRTF to help you locate targets. LEFT/RIGHT tells you horizontal position, PITCH (high/low) indicates vertical position, and VOLUME shows distance. With headphones, you can also sense depth and direction naturally.',
    action: 'Got it',
  },
  'audio-cues': {
    title: 'Understanding 3D Audio 🎧',
    description: 'Click each of the 4 demo pings to hear how different positions sound. Notice how LEFT/RIGHT (panning), VOLUME (distance), and PITCH (height) combine to create 3D audio. The reference target helps you understand spatial relationships.',
    action: 'Continue',
  },
  'multiple-pings': {
    title: 'Triangulate the Target',
    description: 'You have 6 pings to find the target. Use them strategically to narrow down the location. After using most of your pings, a helpful hint may appear to guide you.',
    action: 'Continue',
  },
  'place-guess': {
    title: 'Place Your Final Guess',
    description: 'When you\'re confident about the target\'s location, click "Place Final Guess" below, then click on the canvas to mark where you think the target is.',
    action: 'Continue',
  },
  scoring: {
    title: 'Understanding Your Score',
    description: 'Your score is purely skill-based: proximity (5 pts/%, most important), ping efficiency (up to +200), and time (<10s for bonus, >30s penalty). In later chapters, master special mechanics for +100-200 bonuses, and defeat Level 10 bosses for +150. Achieve B rank (700+) to progress—accuracy is mandatory!',
    action: 'Continue',
  },
  complete: {
    title: 'You\'re Ready!',
    description: 'You\'ve completed the tutorial. Now try the real game and see how well you can echolocate!',
    action: 'Start Game',
  },
};

export function getTutorialState(): TutorialState {
  try {
    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load tutorial state:', error);
  }
  
  return {
    currentStep: 'welcome',
    completed: false,
    skipped: false,
    pingCount: 0,
    replaysUsed: 0,
  };
}

export function saveTutorialState(state: TutorialState): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save tutorial state:', error);
  }
}

export function isTutorialCompleted(): boolean {
  return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
}

export function markTutorialCompleted(): void {
  localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
}

export function resetTutorial(): void {
  localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
}

export function getNextStep(currentStep: TutorialStep, pingCount: number = 0): TutorialStep {
  const stepOrder: TutorialStep[] = [
    'welcome',
    'first-ping',
    'interpret-sound',
    'audio-cues',
    'multiple-pings',
    'place-guess',
    'scoring',
    'complete',
  ];

  const currentIndex = stepOrder.indexOf(currentStep);
  
  // Special logic for ping-dependent steps
  if (currentStep === 'first-ping' && pingCount >= 1) {
    return 'interpret-sound';
  }
  if (currentStep === 'interpret-sound' && pingCount >= 2) {
    return 'audio-cues';
  }
  if (currentStep === 'multiple-pings' && pingCount >= 4) {
    return 'place-guess';
  }

  if (currentIndex < stepOrder.length - 1) {
    return stepOrder[currentIndex + 1];
  }
  
  return 'complete';
}
