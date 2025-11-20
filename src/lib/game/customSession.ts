/**
 * Custom game session persistence
 * Allows players to save their progress and resume custom games
 */

import { CustomGameConfig } from './customConfig';
import { Position, Target } from './coords';
import { GamePhase } from '@/hooks/useGamePhase';

export interface CustomGameSession {
  config: CustomGameConfig;
  gameState: 'playing' | 'round-transition' | 'summary';
  currentRound: number;
  roundScores: any[];
  target: Target;
  pingHistory: any[];
  finalGuess: Position | null;
  pingsUsed: number;
  elapsedTime: number;
  finalTime: number | null;
  targetMoveCount: number;
  gamePhase: GamePhase;
  timestamp: number;
}

const SESSION_KEY = 'echo_custom_active_session';
const LAST_CONFIG_KEY = 'echo_custom_last_config';
const SESSION_EXPIRY_DAYS = 7;

/**
 * Save the current game session to localStorage
 */
export function saveGameSession(session: CustomGameSession): void {
  try {
    const sessionData = {
      ...session,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (e) {
    console.error('Failed to save game session:', e);
  }
}

/**
 * Load the saved game session from localStorage
 * Returns null if no session exists or if it's expired
 */
export function loadGameSession(): CustomGameSession | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session: CustomGameSession = JSON.parse(stored);
    
    // Check if session is expired (7 days old)
    const now = Date.now();
    const age = now - session.timestamp;
    const maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    if (age > maxAge) {
      clearGameSession();
      return null;
    }

    return session;
  } catch (e) {
    console.error('Failed to load game session:', e);
    return null;
  }
}

/**
 * Clear the saved game session
 */
export function clearGameSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear game session:', e);
  }
}

/**
 * Check if there's an active session
 */
export function hasActiveSession(): boolean {
  return loadGameSession() !== null;
}

/**
 * Get the age of the current session in days
 */
export function getSessionAge(): number {
  const session = loadGameSession();
  if (!session) return 0;
  
  const now = Date.now();
  const age = now - session.timestamp;
  return Math.floor(age / (24 * 60 * 60 * 1000));
}

/**
 * Save the last used custom config
 */
export function saveLastConfig(config: CustomGameConfig): void {
  try {
    localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save last config:', e);
  }
}

/**
 * Load the last used custom config
 */
export function loadLastConfig(): CustomGameConfig | null {
  try {
    const stored = localStorage.getItem(LAST_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('Failed to load last config:', e);
    return null;
  }
}

/**
 * Clear the last used config
 */
export function clearLastConfig(): void {
  try {
    localStorage.removeItem(LAST_CONFIG_KEY);
  } catch (e) {
    console.error('Failed to clear last config:', e);
  }
}
