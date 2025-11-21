/**
 * Multi-tab synchronization for Custom Mode using BroadcastChannel API
 * Syncs game state across multiple browser tabs in real-time
 */

import { CustomGameSession } from './customSession';

type SyncMessage = 
  | { type: 'session-updated'; session: CustomGameSession }
  | { type: 'session-cleared' }
  | { type: 'request-sync' }
  | { type: 'tab-active'; tabId: string };

type SessionUpdateCallback = (session: CustomGameSession | null) => void;
type TabCountCallback = (count: number) => void;

/**
 * Singleton manager for cross-tab synchronization
 */
class CustomSessionSyncManager {
  private channel: BroadcastChannel | null = null;
  private subscribers: Set<SessionUpdateCallback> = new Set();
  private tabCountSubscribers: Set<TabCountCallback> = new Set();
  private activeTabs: Set<string> = new Set();
  private tabId: string;
  private heartbeatInterval: number | null = null;

  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.random()}`;
    this.initialize();
  }

  private initialize() {
    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel not supported - multi-tab sync disabled');
      return;
    }

    try {
      this.channel = new BroadcastChannel('echo_custom_game_sync');
      
      // Listen for messages from other tabs
      this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        this.handleMessage(event.data);
      };

      // Announce this tab's presence
      this.broadcastTabActive();
      
      // Send heartbeat every 3 seconds to track active tabs
      this.heartbeatInterval = window.setInterval(() => {
        this.broadcastTabActive();
        this.cleanupInactiveTabs();
      }, 3000);

      // Clean up on page unload
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });

      console.log('Multi-tab sync initialized:', this.tabId);
    } catch (error) {
      console.error('Failed to initialize BroadcastChannel:', error);
    }
  }

  private handleMessage(message: SyncMessage) {
    switch (message.type) {
      case 'session-updated':
        // Notify all subscribers of the update
        this.subscribers.forEach(callback => {
          callback(message.session);
        });
        break;

      case 'session-cleared':
        // Notify all subscribers that session was cleared
        this.subscribers.forEach(callback => {
          callback(null);
        });
        break;

      case 'tab-active':
        if ('tabId' in message) {
          this.activeTabs.add(message.tabId);
          this.notifyTabCount();
        }
        break;

      case 'request-sync':
        // Another tab is requesting current state
        // Individual tabs should respond by broadcasting their current state
        break;
    }
  }

  private broadcastTabActive() {
    if (!this.channel) return;
    
    try {
      this.channel.postMessage({
        type: 'tab-active',
        tabId: this.tabId,
      } as SyncMessage);
    } catch (error) {
      console.error('Failed to broadcast tab active:', error);
    }
  }

  private cleanupInactiveTabs() {
    // Clear all tabs and wait for heartbeats to repopulate
    // This ensures we only count active tabs
    const previousCount = this.activeTabs.size;
    this.activeTabs.clear();
    this.activeTabs.add(this.tabId); // Always include current tab
    
    // Only notify if count changed
    if (previousCount !== this.activeTabs.size) {
      this.notifyTabCount();
    }
  }

  private notifyTabCount() {
    const count = this.activeTabs.size;
    this.tabCountSubscribers.forEach(callback => {
      callback(count);
    });
  }

  /**
   * Subscribe to session updates from other tabs
   * @param callback Called when session is updated or cleared in another tab
   * @returns Unsubscribe function
   */
  subscribe(callback: SessionUpdateCallback): () => void {
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Subscribe to tab count updates
   * @param callback Called when the number of active tabs changes
   * @returns Unsubscribe function
   */
  subscribeTabCount(callback: TabCountCallback): () => void {
    this.tabCountSubscribers.add(callback);
    
    // Immediately notify with current count
    callback(this.activeTabs.size);
    
    return () => {
      this.tabCountSubscribers.delete(callback);
    };
  }

  /**
   * Broadcast a session update to all other tabs
   */
  broadcastSessionUpdate(session: CustomGameSession) {
    if (!this.channel) return;

    try {
      this.channel.postMessage({
        type: 'session-updated',
        session,
      } as SyncMessage);
    } catch (error) {
      console.error('Failed to broadcast session update:', error);
    }
  }

  /**
   * Broadcast that the session was cleared
   */
  broadcastSessionClear() {
    if (!this.channel) return;

    try {
      this.channel.postMessage({
        type: 'session-cleared',
      } as SyncMessage);
    } catch (error) {
      console.error('Failed to broadcast session clear:', error);
    }
  }

  /**
   * Request sync from other tabs (if any have active sessions)
   */
  requestSync() {
    if (!this.channel) return;

    try {
      this.channel.postMessage({
        type: 'request-sync',
      } as SyncMessage);
    } catch (error) {
      console.error('Failed to request sync:', error);
    }
  }

  /**
   * Clean up resources
   */
  private cleanup() {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    this.subscribers.clear();
    this.tabCountSubscribers.clear();
    this.activeTabs.clear();
  }

  /**
   * Check if multi-tab sync is available
   */
  isAvailable(): boolean {
    return this.channel !== null;
  }
}

// Export singleton instance
export const sessionSyncManager = new CustomSessionSyncManager();
