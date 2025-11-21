/**
 * Save Slot Manager for Custom Mode
 * Provides CRUD operations for managing multiple save slots
 */

import { SaveSlot } from './customSessionDB';
import { getDB } from './customSessionDB';
import { CustomGameSession } from './customSession';

/**
 * Get all save slots sorted by last played (most recent first)
 */
export async function getAllSaveSlots(): Promise<SaveSlot[]> {
  try {
    const db = await getDB();
    const slots = await db.getAllFromIndex('save-slots', 'by-last-played');
    
    // Sort descending (most recent first)
    return slots.sort((a, b) => b.lastPlayed - a.lastPlayed);
  } catch (error) {
    console.error('Failed to get save slots:', error);
    return [];
  }
}

/**
 * Create a new save slot with auto-generated or custom ID
 */
export async function createSaveSlot(
  name: string, 
  session: CustomGameSession, 
  customId?: string
): Promise<SaveSlot> {
  try {
    const db = await getDB();
    const id = customId || generateSlotId();
    
    const slot: SaveSlot = {
      id,
      name,
      session,
      lastPlayed: Date.now(),
      createdAt: Date.now(),
    };
    
    await db.add('save-slots', slot);
    return slot;
  } catch (error) {
    console.error('Failed to create save slot:', error);
    throw new Error('Failed to create save slot');
  }
}

/**
 * Update an existing save slot's session
 */
export async function updateSaveSlot(slotId: string, session: CustomGameSession): Promise<void> {
  try {
    const db = await getDB();
    const slot = await db.get('save-slots', slotId);
    
    if (!slot) {
      throw new Error('Save slot not found');
    }
    
    const updatedSlot: SaveSlot = {
      ...slot,
      session,
      lastPlayed: Date.now(),
    };
    
    await db.put('save-slots', updatedSlot);
  } catch (error) {
    console.error('Failed to update save slot:', error);
    throw new Error('Failed to update save slot');
  }
}

/**
 * Delete a save slot
 */
export async function deleteSaveSlot(slotId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('save-slots', slotId);
  } catch (error) {
    console.error('Failed to delete save slot:', error);
    throw new Error('Failed to delete save slot');
  }
}

/**
 * Rename a save slot
 */
export async function renameSaveSlot(slotId: string, newName: string): Promise<void> {
  try {
    const db = await getDB();
    const slot = await db.get('save-slots', slotId);
    
    if (!slot) {
      throw new Error('Save slot not found');
    }
    
    const updatedSlot: SaveSlot = {
      ...slot,
      name: newName.trim(),
    };
    
    await db.put('save-slots', updatedSlot);
  } catch (error) {
    console.error('Failed to rename save slot:', error);
    throw new Error('Failed to rename save slot');
  }
}

/**
 * Load a specific save slot (updates last played timestamp)
 */
export async function loadSaveSlot(slotId: string): Promise<SaveSlot | null> {
  try {
    const db = await getDB();
    const slot = await db.get('save-slots', slotId);
    
    if (!slot) return null;
    
    // Update last played timestamp
    const updatedSlot: SaveSlot = {
      ...slot,
      lastPlayed: Date.now(),
    };
    
    await db.put('save-slots', updatedSlot);
    
    return updatedSlot;
  } catch (error) {
    console.error('Failed to load save slot:', error);
    return null;
  }
}

/**
 * Auto-generate a slot name based on existing slots
 */
export async function autoGenerateSlotName(): Promise<string> {
  const slots = await getAllSaveSlots();
  
  // Find the next available "Game X" name
  let counter = 1;
  const existingNames = new Set(slots.map(s => s.name));
  
  while (existingNames.has(`Game ${counter}`)) {
    counter++;
  }
  
  return `Game ${counter}`;
}

/**
 * Generate a unique slot ID
 */
function generateSlotId(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: generate a UUID-like string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get a save slot by ID
 */
export async function getSaveSlot(slotId: string): Promise<SaveSlot | null> {
  try {
    const db = await getDB();
    return await db.get('save-slots', slotId) || null;
  } catch (error) {
    console.error('Failed to get save slot:', error);
    return null;
  }
}

/**
 * Duplicate a save slot (save as)
 */
export async function duplicateSaveSlot(slotId: string, newName: string): Promise<SaveSlot> {
  try {
    const db = await getDB();
    const slot = await db.get('save-slots', slotId);
    
    if (!slot) {
      throw new Error('Save slot not found');
    }
    
    const newSlot: SaveSlot = {
      id: generateSlotId(),
      name: newName.trim(),
      session: { ...slot.session },
      lastPlayed: Date.now(),
      createdAt: Date.now(),
    };
    
    await db.add('save-slots', newSlot);
    return newSlot;
  } catch (error) {
    console.error('Failed to duplicate save slot:', error);
    throw new Error('Failed to duplicate save slot');
  }
}

/**
 * Get or create the default active slot
 */
export async function getOrCreateActiveSlot(session?: CustomGameSession): Promise<SaveSlot> {
  const slot = await getSaveSlot('__active__');
  if (slot) return slot;
  
  // Create default slot
  if (!session) {
    throw new Error('Cannot create active slot without session data');
  }
  
  return await createSaveSlot('Current Game', session, '__active__');
}

// Export getDB for use in other modules
export { getDB } from './customSessionDB';
