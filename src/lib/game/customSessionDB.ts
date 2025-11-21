/**
 * IndexedDB wrapper for Custom Mode session persistence
 * Provides async, high-capacity storage with localStorage fallback
 * Updated for Save Slot System (Phase 4)
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CustomGameSession } from './customSession';
import { CustomGameConfig } from './customConfig';

export interface SaveSlot {
  id: string; // UUID
  name: string; // User-defined name
  session: CustomGameSession;
  lastPlayed: number;
  createdAt: number;
  thumbnail?: string; // Optional base64 screenshot (future enhancement)
}

interface CustomGameDB extends DBSchema {
  'save-slots': {
    key: string; // Slot ID
    value: SaveSlot;
    indexes: { 
      'by-last-played': number;
      'by-created': number;
    };
  };
  'game-configs': {
    key: string;
    value: CustomGameConfig;
  };
}

const DB_NAME = 'echo-custom-game';
const DB_VERSION = 2; // Incremented for schema change
const LAST_CONFIG_KEY = 'last-config';
const SESSION_EXPIRY_DAYS = 7;

let dbInstance: IDBPDatabase<CustomGameDB> | null = null;

/**
 * Initialize and return the IndexedDB connection
 */
export async function getDB(): Promise<IDBPDatabase<CustomGameDB>> {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<CustomGameDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Migration from v1 to v2: game-sessions -> save-slots
        if (oldVersion < 2) {
          // Migrate old single session to slot if it exists
          if (db.objectStoreNames.contains('game-sessions')) {
            const oldStore = transaction.objectStore('game-sessions');
            const saveSlotStore = db.createObjectStore('save-slots', { keyPath: 'id' });
            saveSlotStore.createIndex('by-last-played', 'lastPlayed');
            saveSlotStore.createIndex('by-created', 'createdAt');
            
            // Migrate active session to a slot (async handled by transaction)
            oldStore.get('active-session').then((oldSession) => {
              if (oldSession) {
                const migratedSlot: SaveSlot = {
                  id: 'migrated-slot',
                  name: 'Game 1',
                  session: oldSession as CustomGameSession,
                  lastPlayed: oldSession.timestamp || Date.now(),
                  createdAt: oldSession.timestamp || Date.now(),
                };
                saveSlotStore.add(migratedSlot);
              }
            });
            
            // Delete old store
            db.deleteObjectStore('game-sessions');
          }
        }

        // Create save-slots store if not exists
        if (!db.objectStoreNames.contains('save-slots')) {
          const slotStore = db.createObjectStore('save-slots', { keyPath: 'id' });
          slotStore.createIndex('by-last-played', 'lastPlayed');
          slotStore.createIndex('by-created', 'createdAt');
        }

        // Create game-configs store if not exists
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

