export type TutorialStep = 
  | 'welcome'
  | 'first-ping'
  | 'interpret-sound'
  | 'multiple-pings'
  | 'place-guess'
  | 'confirm-guess'
  | 'scoring'
  | 'complete';

export interface TutorialState {
  currentStep: TutorialStep;
  completed: boolean;
  skipped: boolean;
  pingCount: number;
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
    action: 'Click to ping',
  },
  'interpret-sound': {
    title: 'Listen to the Feedback',
    description: 'Fast, high-pitched sounds mean you\'re very close. Slow, low-pitched sounds mean you\'re far away. Try pinging in different locations!',
    action: 'Keep pinging',
  },
  'multiple-pings': {
    title: 'Triangulate the Target',
    description: 'You have limited pings to find the target. Use them wisely! Each ping gives you more information about the target\'s location.',
    action: 'Continue pinging',
  },
  'place-guess': {
    title: 'Place Your Final Guess',
    description: 'When you\'re confident about the target\'s location, click the button below to place your final guess.',
    action: 'Place Final Guess',
  },
  'confirm-guess': {
    title: 'Mark the Spot',
    description: 'Click on the canvas where you think the target is located. You can reposition your guess before confirming.',
    action: 'Click to guess',
  },
  scoring: {
    title: 'Understanding Your Score',
    description: 'Your score is based on proximity to the target, pings efficiency, and time taken. The closer you are and fewer pings used, the higher your score!',
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
    'multiple-pings',
    'place-guess',
    'confirm-guess',
    'scoring',
    'complete',
  ];

  const currentIndex = stepOrder.indexOf(currentStep);
  
  // Special logic for ping-dependent steps
  if (currentStep === 'first-ping' && pingCount >= 1) {
    return 'interpret-sound';
  }
  if (currentStep === 'interpret-sound' && pingCount >= 2) {
    return 'multiple-pings';
  }
  if (currentStep === 'multiple-pings' && pingCount >= 4) {
    return 'place-guess';
  }

  if (currentIndex < stepOrder.length - 1) {
    return stepOrder[currentIndex + 1];
  }
  
  return 'complete';
}
