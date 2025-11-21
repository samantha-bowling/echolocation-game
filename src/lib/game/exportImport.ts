/**
 * Export/Import system for Custom Mode saved games
 * Allows players to backup and share their game sessions
 */

import { CustomGameSession } from './customSession';
import { compressData, decompressData } from './compression';

export interface ExportData {
  version: number;
  exportedAt: number;
  session: CustomGameSession;
  metadata?: {
    appVersion?: string;
    platform?: string;
  };
}

const EXPORT_VERSION = 1;

/**
 * Export active session as JSON file
 * @param session The game session to export
 * @param filename Optional custom filename
 */
export function exportSessionAsFile(session: CustomGameSession, filename?: string): void {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    session,
    metadata: {
      appVersion: '1.0.0',
      platform: navigator.userAgent,
    },
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const defaultFilename = `echo-custom-game-${new Date().toISOString().split('T')[0]}.json`;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  link.click();
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Import session from JSON file
 * @param file The JSON file to import
 * @returns Promise resolving to the imported session
 */
export async function importSessionFromFile(file: File): Promise<CustomGameSession> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const exportData: ExportData = JSON.parse(content);
        
        // Validate export data
        if (!validateExportData(exportData)) {
          reject(new Error('Invalid export file format'));
          return;
        }
        
        resolve(exportData.session);
      } catch (error) {
        reject(new Error('Failed to parse export file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Generate a shareable URL with compressed session data
 * @param session The game session to share
 * @returns Promise resolving to the shareable URL
 */
export async function generateShareURL(session: CustomGameSession): Promise<string> {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    session,
  };

  const jsonString = JSON.stringify(exportData);
  const compressed = await compressData(jsonString);
  
  // Create URL with import parameter
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/custom?import=${encodeURIComponent(compressed)}`;
  
  // Check URL length (max 2000 chars for compatibility)
  if (shareUrl.length > 2000) {
    throw new Error('Session too large for share URL. Please export as file instead.');
  }
  
  return shareUrl;
}

/**
 * Import session from share URL code
 * @param importCode The compressed import code from URL
 * @returns Promise resolving to the imported session
 */
export async function importFromShareURL(importCode: string): Promise<CustomGameSession> {
  try {
    const decompressed = await decompressData(importCode);
    const exportData: ExportData = JSON.parse(decompressed);
    
    // Validate export data
    if (!validateExportData(exportData)) {
      throw new Error('Invalid share URL format');
    }
    
    return exportData.session;
  } catch (error) {
    console.error('Failed to import from share URL:', error);
    throw new Error('Failed to import from share URL. The link may be invalid or corrupted.');
  }
}

/**
 * Validate export data structure
 * @param data The export data to validate
 * @returns True if valid, false otherwise
 */
function validateExportData(data: any): data is ExportData {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.version !== 'number') return false;
  if (typeof data.exportedAt !== 'number') return false;
  if (!data.session || typeof data.session !== 'object') return false;
  
  // Validate required session fields
  const session = data.session;
  if (!session.config) return false;
  if (typeof session.gameState !== 'string') return false;
  if (typeof session.currentRound !== 'number') return false;
  if (!Array.isArray(session.roundScores)) return false;
  if (!session.target) return false;
  
  return true;
}

/**
 * Get formatted file size for display
 * @param bytes Size in bytes
 * @returns Formatted string (e.g., "2.5 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get human-readable export age
 * @param timestamp Export timestamp
 * @returns Formatted string (e.g., "2 days ago")
 */
export function formatExportAge(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
