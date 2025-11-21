/**
 * IndexedDB wrapper for Custom Mode session persistence
 * Provides async, high-capacity storage with localStorage fallback
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CustomGameSession } from './customSession';
import { CustomGameConfig } from './customConfig';

interface CustomGameDB extends DBSchema {
  'game-sessions': {
    key: string;
    value: CustomGameSession & { id: string };
    indexes: { 'by-timestamp': number };
  };
  'game-configs': {
    key: string;
    value: CustomGameConfig;
  };
}

const DB_NAME = 'echo-custom-game';
const DB_VERSION = 1;
const SESSION_KEY = 'active-session';
const LAST_CONFIG_KEY = 'last-config';
const SESSION_EXPIRY_DAYS = 7;

let dbInstance: IDBPDatabase<CustomGameDB> | null = null;

/**
 * Initialize and return the IndexedDB connection
 */
async function getDB(): Promise<IDBPDatabase<CustomGameDB>> {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<CustomGameDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create game-sessions store
        if (!db.objectStoreNames.contains('game-sessions')) {
          const sessionStore = db.createObjectStore('game-sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-timestamp', 'timestamp');
        }

        // Create game-configs store
        if (!db.objectStoreNames.contains('game-configs')) {
          db.createObjectStore('game-configs');
        }
      },
    });

    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
}

/**
 * Save the current game session to IndexedDB
 */
export async function saveGameSessionDB(session: CustomGameSession): Promise<void> {
  try {
    const db = await getDB();
    const sessionWithId = {
      ...session,
      id: SESSION_KEY,
      timestamp: Date.now(),
    };
    
    await db.put('game-sessions', sessionWithId);
  } catch (error) {
    console.error('Failed to save game session to IndexedDB:', error);
    // Fallback to localStorage
    try {
      localStorage.setItem('echo_custom_active_session', JSON.stringify(session));
    } catch (e) {
      console.error('Fallback to localStorage also failed:', e);
    }
  }
}

/**
 * Load the saved game session from IndexedDB
 * Returns null if no session exists or if it's expired
 */
export async function loadGameSessionDB(): Promise<CustomGameSession | null> {
  try {
    const db = await getDB();
    const sessionWithId = await db.get('game-sessions', SESSION_KEY);
    
    if (!sessionWithId) return null;

    // Check if session is expired (7 days old)
    const now = Date.now();
    const age = now - sessionWithId.timestamp;
    const maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    if (age > maxAge) {
      await clearGameSessionDB();
      return null;
    }

    // Remove the id field before returning
    const { id, ...session } = sessionWithId;
    return session as CustomGameSession;
  } catch (error) {
    console.error('Failed to load game session from IndexedDB:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('echo_custom_active_session');
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (e) {
      console.error('Fallback to localStorage also failed:', e);
      return null;
    }
  }
}

/**
 * Clear the saved game session
 */
export async function clearGameSessionDB(): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('game-sessions', SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear game session from IndexedDB:', error);
    // Fallback to localStorage
    try {
      localStorage.removeItem('echo_custom_active_session');
    } catch (e) {
      console.error('Fallback to localStorage also failed:', e);
    }
  }
}

/**
 * Check if there's an active session
 */
export async function hasActiveSessionDB(): Promise<boolean> {
  const session = await loadGameSessionDB();
  return session !== null;
}

/**
 * Get the age of the current session in days
 */
export async function getSessionAgeDB(): Promise<number> {
  const session = await loadGameSessionDB();
  if (!session) return 0;
  
  const now = Date.now();
  const age = now - session.timestamp;
  return Math.floor(age / (24 * 60 * 60 * 1000));
}

/**
 * Save the last used custom config
 */
export async function saveLastConfigDB(config: CustomGameConfig): Promise<void> {
  try {
    const db = await getDB();
    await db.put('game-configs', config, LAST_CONFIG_KEY);
  } catch (error) {
    console.error('Failed to save last config to IndexedDB:', error);
    // Fallback to localStorage
    try {
      localStorage.setItem('echo_custom_last_config', JSON.stringify(config));
    } catch (e) {
      console.error('Fallback to localStorage also failed:', e);
    }
  }
}

/**
 * Load the last used custom config
 */
export async function loadLastConfigDB(): Promise<CustomGameConfig | null> {
  try {
    const db = await getDB();
    const config = await db.get('game-configs', LAST_CONFIG_KEY);
    return config || null;
  } catch (error) {
    console.error('Failed to load last config from IndexedDB:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('echo_custom_last_config');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Fallback to localStorage also failed:', e);
      return null;
    }
  }
}

/**
 * Clear the last used config
 */
export async function clearLastConfigDB(): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('game-configs', LAST_CONFIG_KEY);
  } catch (error) {
    console.error('Failed to clear last config from IndexedDB:', error);
    // Fallback to localStorage
    try {
      localStorage.removeItem('echo_custom_last_config');
    } catch (e) {
      console.error('Fallback to localStorage also failed:', e);
    }
  }
}
