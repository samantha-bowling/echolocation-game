# Custom Mode Save System - Complete Roadmap

## Overview
This document outlines the complete save system architecture for Custom Mode, from the basic implementation (Phase 1) to advanced features (Phases 2-5).

---

## ✅ Phase 1: Core Save System (IMPLEMENTED)

### Status: COMPLETE
Implemented comprehensive save system with throttled auto-saves, visual feedback, and manual controls.

### Features Implemented:
- ✅ **Throttled Auto-Save**: 2-second throttling prevents excessive localStorage writes
- ✅ **Visual Save Indicator**: Shows "Saving..." and "Saved" status with animations
- ✅ **Enhanced Menu Button**: "Save & Menu" explicitly saves before navigation
- ✅ **Manual Save Button**: Dedicated save button with toast confirmation
- ✅ **BeforeUnload Handler**: Saves game state on browser refresh/close
- ✅ **Session Resume**: Banner in CustomMode.tsx allows resuming active games

### Performance:
- Before: ~600 saves/minute (excessive)
- After: Max ~30 saves/minute (95% reduction)
- No impact on gameplay smoothness

---

## 🔄 Phase 2: IndexedDB Migration

### Status: PLANNED
Migrate from localStorage to IndexedDB for better performance and capacity.

### Why IndexedDB?
- **Capacity**: 50MB+ vs localStorage's 5-10MB limit
- **Performance**: Async operations don't block UI thread
- **Structure**: Better for complex game state objects
- **Future-proof**: Supports advanced features like save slots

### Implementation Plan:

#### 2.1: Create IndexedDB Wrapper
**File**: `src/lib/game/customSessionDB.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CustomGameDB extends DBSchema {
  'game-sessions': {
    key: string;
    value: CustomGameSession;
    indexes: { 'by-timestamp': number };
  };
  'game-configs': {
    key: string;
    value: CustomGameConfig;
  };
}

const DB_NAME = 'echo-custom-games';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<CustomGameDB> | null = null;

/**
 * Initialize and open the database
 */
async function getDB(): Promise<IDBPDatabase<CustomGameDB>> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<CustomGameDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create game sessions store
      if (!db.objectStoreNames.contains('game-sessions')) {
        const sessionsStore = db.createObjectStore('game-sessions', { 
          keyPath: 'id' 
        });
        sessionsStore.createIndex('by-timestamp', 'timestamp');
      }
      
      // Create configs store
      if (!db.objectStoreNames.contains('game-configs')) {
        db.createObjectStore('game-configs');
      }
    },
  });
  
  return dbInstance;
}

/**
 * Save active game session
 */
export async function saveGameSessionDB(session: CustomGameSession): Promise<void> {
  try {
    const db = await getDB();
    const sessionWithId = {
      ...session,
      id: 'active-session', // Single active session
    };
    await db.put('game-sessions', sessionWithId);
  } catch (e) {
    console.error('Failed to save game session to IndexedDB:', e);
    // Fallback to localStorage
    localStorage.setItem('echo_custom_active_session', JSON.stringify(session));
  }
}

/**
 * Load active game session
 */
export async function loadGameSessionDB(): Promise<CustomGameSession | null> {
  try {
    const db = await getDB();
    const session = await db.get('game-sessions', 'active-session');
    
    if (!session) return null;
    
    // Check expiry (7 days)
    const now = Date.now();
    const age = now - session.timestamp;
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    
    if (age > maxAge) {
      await clearGameSessionDB();
      return null;
    }
    
    return session;
  } catch (e) {
    console.error('Failed to load game session from IndexedDB:', e);
    // Fallback to localStorage
    const stored = localStorage.getItem('echo_custom_active_session');
    return stored ? JSON.parse(stored) : null;
  }
}

/**
 * Clear active game session
 */
export async function clearGameSessionDB(): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('game-sessions', 'active-session');
  } catch (e) {
    console.error('Failed to clear game session from IndexedDB:', e);
    localStorage.removeItem('echo_custom_active_session');
  }
}

/**
 * Save last used config
 */
export async function saveLastConfigDB(config: CustomGameConfig): Promise<void> {
  try {
    const db = await getDB();
    await db.put('game-configs', config, 'last-config');
  } catch (e) {
    console.error('Failed to save last config to IndexedDB:', e);
    localStorage.setItem('echo_custom_last_config', JSON.stringify(config));
  }
}

/**
 * Load last used config
 */
export async function loadLastConfigDB(): Promise<CustomGameConfig | null> {
  try {
    const db = await getDB();
    const config = await db.get('game-configs', 'last-config');
    return config || null;
  } catch (e) {
    console.error('Failed to load last config from IndexedDB:', e);
    const stored = localStorage.getItem('echo_custom_last_config');
    return stored ? JSON.parse(stored) : null;
  }
}
```

#### 2.2: Gradual Migration Strategy
1. Install `idb` package: `npm install idb`
2. Create new DB functions (above)
3. Update `CustomGame.tsx` to use async save functions
4. Add migration helper to move existing localStorage data to IndexedDB
5. Keep localStorage as fallback for errors
6. Test thoroughly before deprecating localStorage

#### 2.3: Migration Helper
**File**: `src/lib/game/migrateToIndexedDB.ts`

```typescript
import { saveGameSessionDB, saveLastConfigDB } from './customSessionDB';
import { loadGameSession, loadLastConfig } from './customSession';

/**
 * One-time migration from localStorage to IndexedDB
 */
export async function migrateToIndexedDB(): Promise<boolean> {
  try {
    // Check if migration already done
    const migrated = localStorage.getItem('echo_migrated_to_indexeddb');
    if (migrated) return true;
    
    // Migrate active session
    const session = loadGameSession();
    if (session) {
      await saveGameSessionDB(session);
    }
    
    // Migrate last config
    const config = loadLastConfig();
    if (config) {
      await saveLastConfigDB(config);
    }
    
    // Mark migration as complete
    localStorage.setItem('echo_migrated_to_indexeddb', 'true');
    console.log('Successfully migrated to IndexedDB');
    
    return true;
  } catch (e) {
    console.error('Migration to IndexedDB failed:', e);
    return false;
  }
}
```

#### 2.4: Update CustomGame.tsx
- Replace `saveGameSession` with `saveGameSessionDB` (make throttled save async)
- Replace `loadGameSession` with `loadGameSessionDB`
- Replace `clearGameSession` with `clearGameSessionDB`
- Run migration on app mount (in `App.tsx`)

### Testing Phase 2:
- [ ] IndexedDB initializes correctly
- [ ] Save operations are async and don't block UI
- [ ] Migration from localStorage works seamlessly
- [ ] Fallback to localStorage on errors
- [ ] Data persists across browser sessions
- [ ] Large game states (50+ rounds) save successfully

### Benefits:
- 10x storage capacity increase
- Better performance (async operations)
- Foundation for Phase 3 & 4 features
- More robust error handling

---

## 🔄 Phase 3: Multi-Tab Synchronization

### Status: PLANNED
Enable players to have the same game state across multiple browser tabs.

### Problem:
Currently, opening the game in multiple tabs can cause data conflicts if players interact with both tabs.

### Solution:
Use **BroadcastChannel API** for real-time cross-tab communication.

### Implementation Plan:

#### 3.1: Create Sync Manager
**File**: `src/lib/game/customSessionSync.ts`

```typescript
import { CustomGameSession } from './customSessionDB';

type SyncMessage = 
  | { type: 'session-updated'; session: CustomGameSession }
  | { type: 'session-cleared' }
  | { type: 'request-sync' };

class CustomSessionSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(session: CustomGameSession | null) => void> = new Set();
  
  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('echo_custom_game_sync');
      this.setupListeners();
    }
  }
  
  private setupListeners() {
    if (!this.channel) return;
    
    this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data;
      
      switch (message.type) {
        case 'session-updated':
          this.notifyListeners(message.session);
          break;
        case 'session-cleared':
          this.notifyListeners(null);
          break;
        case 'request-sync':
          // Another tab is requesting current state
          // The active tab should respond with current state
          break;
      }
    };
  }
  
  /**
   * Notify all other tabs that session was updated
   */
  broadcastSessionUpdate(session: CustomGameSession) {
    this.channel?.postMessage({
      type: 'session-updated',
      session,
    });
  }
  
  /**
   * Notify all other tabs that session was cleared
   */
  broadcastSessionClear() {
    this.channel?.postMessage({
      type: 'session-cleared',
    });
  }
  
  /**
   * Request sync from other tabs (e.g., on page load)
   */
  requestSync() {
    this.channel?.postMessage({
      type: 'request-sync',
    });
  }
  
  /**
   * Subscribe to sync events
   */
  subscribe(listener: (session: CustomGameSession | null) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(session: CustomGameSession | null) {
    this.listeners.forEach(listener => listener(session));
  }
  
  destroy() {
    this.channel?.close();
    this.listeners.clear();
  }
}

export const sessionSyncManager = new CustomSessionSyncManager();
```

#### 3.2: Integrate into CustomGame.tsx
```typescript
// In CustomGame.tsx

useEffect(() => {
  // Subscribe to sync events from other tabs
  const unsubscribe = sessionSyncManager.subscribe((syncedSession) => {
    if (syncedSession) {
      // Another tab updated the game - sync state
      setGameState(syncedSession.gameState);
      setCurrentRound(syncedSession.currentRound);
      setRoundScores(syncedSession.roundScores);
      setTarget(syncedSession.target);
      // ... update all state
      
      toast({
        title: 'Game Synced',
        description: 'Updated from another tab',
        duration: 2000,
      });
    } else {
      // Session was cleared in another tab
      toast({
        title: 'Game Ended',
        description: 'Session ended in another tab',
        duration: 2000,
      });
    }
  });
  
  return unsubscribe;
}, []);

// Update saveGameThrottled to broadcast
const saveGameThrottled = useCallback(() => {
  // ... existing save logic ...
  
  saveGameSessionDB(sessionData);
  sessionSyncManager.broadcastSessionUpdate(sessionData);
  
  // ... rest of logic ...
}, [/* dependencies */]);

// Update handleQuitGame to broadcast
const handleQuitGame = () => {
  // ... existing logic ...
  
  clearGameSessionDB();
  sessionSyncManager.broadcastSessionClear();
  
  // ... navigation ...
};
```

#### 3.3: Visual Indicator for Multi-Tab
Add a small indicator when multiple tabs are detected:
```tsx
{isMultiTab && (
  <div className="text-xs text-muted-foreground flex items-center gap-1">
    <Users className="w-3 h-3" />
    <span>Multi-tab active</span>
  </div>
)}
```

### Testing Phase 3:
- [ ] Opening game in 2+ tabs shows sync indicator
- [ ] Making a move in one tab updates other tabs
- [ ] Saving in one tab updates other tabs
- [ ] Quitting in one tab notifies other tabs
- [ ] No data conflicts or race conditions
- [ ] BroadcastChannel fallback for unsupported browsers

### Benefits:
- Seamless multi-tab experience
- Prevents data loss from conflicting tabs
- Real-time sync feels magical to users
- Foundation for future collaborative features

---

## 🔄 Phase 4: Save Slot System

### Status: PLANNED
Allow players to have multiple saved games simultaneously.

### Problem:
Currently, only one active game can be saved at a time. Players may want to experiment with different configs without losing progress.

### Solution:
Implement a **save slot system** with named save files.

### Implementation Plan:

#### 4.1: Update Database Schema
```typescript
// Update CustomGameDB schema in customSessionDB.ts

interface CustomGameDB extends DBSchema {
  'game-sessions': {
    key: string; // Save slot ID
    value: SaveSlot;
    indexes: { 
      'by-timestamp': number;
      'by-last-played': number;
    };
  };
  // ... other stores
}

interface SaveSlot {
  id: string; // Unique ID (uuid)
  name: string; // User-defined name
  session: CustomGameSession;
  lastPlayed: number;
  createdAt: number;
  thumbnail?: string; // Optional screenshot
}
```

#### 4.2: Save Slot Manager
**File**: `src/lib/game/saveSlotManager.ts`

```typescript
import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all save slots, sorted by last played
 */
export async function getAllSaveSlots(): Promise<SaveSlot[]> {
  const db = await getDB();
  const slots = await db.getAllFromIndex('game-sessions', 'by-last-played');
  return slots.reverse(); // Most recent first
}

/**
 * Create a new save slot
 */
export async function createSaveSlot(
  name: string, 
  session: CustomGameSession
): Promise<SaveSlot> {
  const db = await getDB();
  
  const slot: SaveSlot = {
    id: uuidv4(),
    name,
    session,
    lastPlayed: Date.now(),
    createdAt: Date.now(),
  };
  
  await db.put('game-sessions', slot);
  return slot;
}

/**
 * Update existing save slot
 */
export async function updateSaveSlot(
  slotId: string, 
  session: CustomGameSession
): Promise<void> {
  const db = await getDB();
  const slot = await db.get('game-sessions', slotId);
  
  if (!slot) throw new Error('Save slot not found');
  
  slot.session = session;
  slot.lastPlayed = Date.now();
  
  await db.put('game-sessions', slot);
}

/**
 * Delete a save slot
 */
export async function deleteSaveSlot(slotId: string): Promise<void> {
  const db = await getDB();
  await db.delete('game-sessions', slotId);
}

/**
 * Rename a save slot
 */
export async function renameSaveSlot(
  slotId: string, 
  newName: string
): Promise<void> {
  const db = await getDB();
  const slot = await db.get('game-sessions', slotId);
  
  if (!slot) throw new Error('Save slot not found');
  
  slot.name = newName;
  await db.put('game-sessions', slot);
}

/**
 * Load a specific save slot
 */
export async function loadSaveSlot(slotId: string): Promise<CustomGameSession | null> {
  const db = await getDB();
  const slot = await db.get('game-sessions', slotId);
  
  if (!slot) return null;
  
  // Update last played time
  slot.lastPlayed = Date.now();
  await db.put('game-sessions', slot);
  
  return slot.session;
}
```

#### 4.3: Save Slot Picker UI
**File**: `src/components/SaveSlotPicker.tsx`

```tsx
interface SaveSlotPickerProps {
  onSelectSlot: (slotId: string) => void;
  onNewGame: () => void;
}

export function SaveSlotPicker({ onSelectSlot, onNewGame }: SaveSlotPickerProps) {
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSlots();
  }, []);
  
  const loadSlots = async () => {
    const allSlots = await getAllSaveSlots();
    setSlots(allSlots);
    setLoading(false);
  };
  
  const handleDelete = async (slotId: string) => {
    await deleteSaveSlot(slotId);
    await loadSlots();
    toast({ title: 'Save Deleted' });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-2">Load Game</h2>
        <Button onClick={onNewGame}>
          <Plus className="w-4 h-4 mr-2" />
          New Game
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No saved games</p>
          <Button onClick={onNewGame} className="mt-4">
            Start New Game
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {slots.map(slot => (
            <Card key={slot.id} className="hover-lift cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1" onClick={() => onSelectSlot(slot.id)}>
                    <h3 className="font-semibold">{slot.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Round {slot.session.currentRound}
                      {slot.session.config.numberOfRounds > 0 && 
                        ` of ${slot.session.config.numberOfRounds}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last played: {formatDistanceToNow(slot.lastPlayed)} ago
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleDelete(slot.id)}>
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => /* rename logic */}>
                        <Edit className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 4.4: Integration Flow
1. **CustomMode.tsx**: Show SaveSlotPicker instead of direct "Start Game" button
2. **New Game**: Create new save slot with auto-generated name ("Game 1", "Game 2", etc.)
3. **Load Game**: Load selected slot's session into CustomGame
4. **Auto-save**: Continue auto-saving to the active slot
5. **Quick save**: Add "Save As..." option to create a new slot from current state

### Testing Phase 4:
- [ ] Can create multiple save slots
- [ ] Each slot tracks independent game state
- [ ] Slot picker shows correct info (round, config, last played)
- [ ] Deleting a slot doesn't affect others
- [ ] Renaming slots works correctly
- [ ] Auto-save updates correct slot
- [ ] No slot limit (or high limit like 50 slots)

### Benefits:
- Multiple concurrent experiments
- Try different configs without losing progress
- "Quick save" capability
- Foundation for sharing specific saves
- Power users can organize their games

---

## 🔄 Phase 5: Export/Import System

### Status: PLANNED
Allow players to export/import their saved games as JSON files for backup and sharing.

### Problem:
- Players want to backup their progress
- Players want to share interesting game states with friends
- Players switching devices want to transfer saves

### Solution:
Implement **export to JSON** and **import from JSON** functionality.

### Implementation Plan:

#### 5.1: Export Function
**File**: `src/lib/game/exportImport.ts`

```typescript
/**
 * Export a save slot to JSON file
 */
export function exportSaveSlot(slot: SaveSlot): void {
  const exportData = {
    version: 1, // For future compatibility
    exportedAt: Date.now(),
    slot,
  };
  
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `echo-save-${slot.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export all save slots
 */
export async function exportAllSaveSlots(): Promise<void> {
  const slots = await getAllSaveSlots();
  
  const exportData = {
    version: 1,
    exportedAt: Date.now(),
    slots,
  };
  
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `echo-all-saves-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate imported save data
 */
function validateImportData(data: any): boolean {
  if (!data.version || !data.slot) return false;
  
  const slot = data.slot;
  if (!slot.id || !slot.name || !slot.session) return false;
  
  const session = slot.session;
  if (!session.config || !session.gameState || !session.target) return false;
  
  return true;
}

/**
 * Import a save slot from JSON file
 */
export function importSaveSlot(
  file: File,
  onSuccess: (slot: SaveSlot) => void,
  onError: (error: string) => void
): void {
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      const json = e.target?.result as string;
      const data = JSON.parse(json);
      
      if (!validateImportData(data)) {
        throw new Error('Invalid save file format');
      }
      
      // Generate new ID to avoid conflicts
      const importedSlot: SaveSlot = {
        ...data.slot,
        id: uuidv4(),
        name: `${data.slot.name} (Imported)`,
        createdAt: Date.now(),
        lastPlayed: Date.now(),
      };
      
      // Save to database
      const db = await getDB();
      await db.put('game-sessions', importedSlot);
      
      onSuccess(importedSlot);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to import save');
    }
  };
  
  reader.onerror = () => {
    onError('Failed to read file');
  };
  
  reader.readAsText(file);
}

/**
 * Import multiple save slots from JSON file
 */
export function importAllSaveSlots(
  file: File,
  onSuccess: (count: number) => void,
  onError: (error: string) => void
): void {
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      const json = e.target?.result as string;
      const data = JSON.parse(json);
      
      if (!data.version || !data.slots || !Array.isArray(data.slots)) {
        throw new Error('Invalid save file format');
      }
      
      const db = await getDB();
      let importedCount = 0;
      
      for (const slot of data.slots) {
        // Generate new ID to avoid conflicts
        const importedSlot: SaveSlot = {
          ...slot,
          id: uuidv4(),
          name: `${slot.name} (Imported)`,
          createdAt: Date.now(),
          lastPlayed: Date.now(),
        };
        
        await db.put('game-sessions', importedSlot);
        importedCount++;
      }
      
      onSuccess(importedCount);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to import saves');
    }
  };
  
  reader.onerror = () => {
    onError('Failed to read file');
  };
  
  reader.readAsText(file);
}
```

#### 5.2: UI Components
Add to SaveSlotPicker:

```tsx
// Export single slot
<DropdownMenuItem onClick={() => exportSaveSlot(slot)}>
  <Download className="w-4 h-4 mr-2" />
  Export
</DropdownMenuItem>

// Export all button
<Button variant="outline" onClick={exportAllSaveSlots}>
  <Download className="w-4 h-4 mr-2" />
  Export All
</Button>

// Import button with file input
<Button variant="outline" onClick={() => fileInputRef.current?.click()}>
  <Upload className="w-4 h-4 mr-2" />
  Import
</Button>
<input
  ref={fileInputRef}
  type="file"
  accept=".json"
  className="hidden"
  onChange={handleFileChange}
/>
```

#### 5.3: Share Code Integration
Combine with existing share code system:

```typescript
/**
 * Export save slot as shareable URL
 */
export function generateShareURL(slot: SaveSlot): string {
  // Compress and encode save data
  const compressed = compressSaveData(slot);
  const base64 = btoa(compressed);
  
  return `${window.location.origin}/custom?import=${base64}`;
}

/**
 * Import save from share URL
 */
export function importFromShareURL(importCode: string): SaveSlot | null {
  try {
    const compressed = atob(importCode);
    const slot = decompressSaveData(compressed);
    
    // Validate and return
    if (validateImportData({ version: 1, slot })) {
      return {
        ...slot,
        id: uuidv4(),
        name: `${slot.name} (Shared)`,
      };
    }
  } catch (e) {
    console.error('Failed to import from share URL:', e);
  }
  
  return null;
}
```

### Testing Phase 5:
- [ ] Export creates valid JSON file
- [ ] Import restores game state correctly
- [ ] Import renames to avoid conflicts
- [ ] Export all includes all slots
- [ ] Import all handles multiple slots
- [ ] Share URL generates correctly
- [ ] Share URL imports successfully
- [ ] File validation catches corrupted files
- [ ] Large saves (50+ rounds) export/import successfully

### Benefits:
- Backup and restore capability
- Share interesting game states with community
- Transfer saves between devices
- Debug issues by sharing save files
- Community could share challenge saves

---

## 🎯 Summary & Next Steps

### Phase 1 (COMPLETE)
✅ Basic save system with visual feedback and manual controls

### Phase 2 (Next Priority)
🔄 IndexedDB migration for better performance and capacity
- **Estimated effort**: 8-12 hours
- **Complexity**: Medium
- **Dependencies**: `idb` package
- **Risk**: Low (localStorage fallback)

### Phase 3 (Medium Priority)
🔄 Multi-tab synchronization
- **Estimated effort**: 6-8 hours
- **Complexity**: Medium
- **Dependencies**: BroadcastChannel API (widely supported)
- **Risk**: Low (optional feature)

### Phase 4 (Lower Priority)
🔄 Save slot system
- **Estimated effort**: 12-16 hours
- **Complexity**: High (new UI, database changes)
- **Dependencies**: Phase 2 (IndexedDB)
- **Risk**: Medium (complex state management)

### Phase 5 (Future Enhancement)
🔄 Export/Import system
- **Estimated effort**: 6-10 hours
- **Complexity**: Medium
- **Dependencies**: Phase 4 (save slots)
- **Risk**: Low (additive feature)

### Total Implementation Time
- **Phase 2-5**: ~32-46 hours
- **Recommended order**: 2 → 3 → 5 → 4
  - Phase 4 can come last as it's the most complex
  - Phase 5 doesn't strictly require Phase 4 (can export active session)

---

## 📝 Notes for Future Implementation

### Considerations
1. **Browser Support**: All features use modern web APIs with good support (90%+)
2. **Mobile**: All features work on mobile browsers
3. **Storage Limits**: IndexedDB has no practical limit for game saves
4. **Performance**: Async operations ensure smooth gameplay
5. **Data Integrity**: Multiple fallbacks prevent data loss

### Alternative Approaches
- **Cloud Sync**: Would require backend (explicitly avoided per requirements)
- **Service Worker**: Could enable offline support (potential Phase 6)
- **Compression**: Could reduce storage for large saves (add to Phase 5)

### Community Features (Optional Phase 6)
If backend is ever added:
- Cloud save sync across devices
- Community save sharing platform
- Save slot tags/categories
- Save file ratings and comments
- Challenge saves with leaderboards

---

## 🔧 Technical Debt & Refactoring Opportunities

### Current localStorage Usage
Phase 2 will eliminate most localStorage usage:
- ✅ Active session → IndexedDB
- ✅ Last config → IndexedDB
- ⚠️ Custom presets → Consider moving to IndexedDB
- ⚠️ Stats → Consider moving to IndexedDB
- ⚠️ Settings → Keep in localStorage (small, sync across app)

### Code Organization
Consider creating a unified save system:
```
src/lib/game/saves/
  ├── index.ts              # Main exports
  ├── database.ts           # IndexedDB setup
  ├── session.ts            # Session management
  ├── slots.ts              # Save slot system
  ├── sync.ts               # Multi-tab sync
  ├── export.ts             # Export/import
  └── migration.ts          # Data migration
```

---

**End of Roadmap**

This document serves as the complete technical specification for all save system phases. Each phase can be implemented independently (respecting dependencies), allowing for incremental improvements to the user experience.
