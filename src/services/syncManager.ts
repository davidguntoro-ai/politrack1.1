import { getUnsyncedReports, markAsSynced, VoterReport, getUnsyncedCount } from './db';

const API_URL = '/api'; // Using relative path
const SYNC_RETRY_MS = 5 * 60 * 1000; // 5 minutes retry

type SyncListener = (count: number, isSyncing: boolean) => void;

export class SyncManager {
  private static isSyncing = false;
  private static listeners: SyncListener[] = [];
  private static syncInterval: any = null;

  static addListener(listener: SyncListener) {
    this.listeners.push(listener);
    this.notify();
  }

  static removeListener(listener: SyncListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private static async notify() {
    const count = await getUnsyncedCount();
    this.listeners.forEach(l => l(count, this.isSyncing));
  }

  static async sync() {
    if (this.isSyncing) return;
    if (!navigator.onLine) return;

    const unsynced = await getUnsyncedReports();
    if (unsynced.length === 0) {
      this.notify();
      return;
    }

    this.isSyncing = true;
    this.notify();
    console.log(`[SyncManager] Found ${unsynced.length} reports to sync...`);

    for (const report of unsynced) {
      try {
        const response = await fetch(`${API_URL}/survey`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        });

        if (response.ok) {
          if (report.id !== undefined) {
            await markAsSynced(report.id);
            console.log(`[SyncManager] Synced report ID: ${report.id}`);
          }
        } else {
          console.error(`[SyncManager] Failed to sync report ID: ${report.id}`, await response.text());
        }
      } catch (error) {
        console.error(`[SyncManager] Network error during sync for report ID: ${report.id}`, error);
        break; // Stop syncing if there's a network error
      }
    }

    this.isSyncing = false;
    this.notify();
  }

  static start() {
    if (this.syncInterval) return;

    // Listen for online event
    window.addEventListener('online', () => {
      console.log('[SyncManager] Online detected. Starting sync...');
      this.sync();
    });
    
    // Periodic sync attempt (5 minutes as requested for retry)
    this.syncInterval = setInterval(() => this.sync(), SYNC_RETRY_MS);
    
    // Initial sync
    this.sync();
  }
}
