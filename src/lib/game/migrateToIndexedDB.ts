/**
 * Migration helper to move existing localStorage data to IndexedDB
 * Runs once on app load to ensure seamless transition
 */

import { createSaveSlot, getSaveSlot } from './saveSlotManager';
import { saveLastConfigDB } from './customSessionDB';
import { loadGameSession, loadLastConfig } from './customSession';

const MIGRATION_FLAG = 'echo_migrated_to_indexeddb';

/**
 * Migrate existing localStorage data to IndexedDB
 * Safe to call multiple times - only runs once
 */
export async function migrateToIndexedDB(): Promise<void> {
  // Check if migration already completed
  try {
    const migrated = localStorage.getItem(MIGRATION_FLAG);
    if (migrated === 'true') {
      return; // Already migrated
    }
  } catch (e) {
    console.error('Failed to check migration flag:', e);
    return;
  }

  console.log('Starting migration to IndexedDB...');

  try {
    // Migrate active session to __active__ slot
    const existingSession = loadGameSession();
    if (existingSession) {
      const existingSlot = await getSaveSlot('__active__');
      if (!existingSlot) {
        await createSaveSlot('Current Game', existingSession, '__active__');
        console.log('✓ Migrated active session to save slot');
      }
    }

    // Migrate last config
    const existingConfig = loadLastConfig();
    if (existingConfig) {
      await saveLastConfigDB(existingConfig);
      console.log('✓ Migrated last config to IndexedDB');
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_FLAG, 'true');
    console.log('✓ Migration to IndexedDB complete');

    // Note: We intentionally keep localStorage data as backup
    // It will be used as fallback if IndexedDB fails
  } catch (error) {
    console.error('Migration to IndexedDB failed:', error);
    // Don't set migration flag on failure - will retry next time
  }
}

/**
 * Verify migration was successful
 */
export async function verifyMigration(): Promise<boolean> {
  try {
    const dbSlot = await getSaveSlot('__active__');
    const localSession = loadGameSession();
    const localConfig = loadLastConfig();

    // If localStorage has data but IndexedDB doesn't, migration failed
    if (localSession && !dbSlot) return false;

    return true;
  } catch (error) {
    console.error('Migration verification failed:', error);
    return false;
  }
}
