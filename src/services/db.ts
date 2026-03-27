import { openDB, DBSchema, IDBPDatabase } from 'idb';

export enum SupportStatus {
  PENDUKUNG = 'HIJAU',
  SWING = 'KUNING',
  LAWAN = 'MERAH',
}

export interface VoterReport {
  id?: number;
  voter_id: string;
  voter_name: string;
  voter_nik: string;
  support_status: SupportStatus;
  awareness: string;
  program_support_rating: number;
  issues: string[];
  swing_voter_reason?: string;
  note: string;
  photo_base64: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  synced: boolean;
  is_mock_location: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  assigned_kabupaten: string;
  assigned_kecamatan: string;
  assigned_desa: string;
}

let dbPromise: Promise<any>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB('politrack-mobile-db', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('reports', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-synced', 'synced');
        }
        if (oldVersion < 2) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const setProfile = async (profile: UserProfile) => {
  const db = await getDB();
  await db.put('profile', profile);
};

export const getProfile = async (): Promise<UserProfile | null> => {
  const db = await getDB();
  const profiles = await db.getAll('profile');
  return profiles[0] || null;
};

export const saveReportLocally = async (report: Omit<VoterReport, 'id' | 'synced'>) => {
  const db = await getDB();
  return db.add('reports', { ...report, synced: false });
};

export const getUnsyncedReports = async () => {
  const db = await getDB();
  return db.getAllFromIndex('reports', 'by-synced', false);
};

export const getUnsyncedCount = async () => {
  const db = await getDB();
  const count = await db.countFromIndex('reports', 'by-synced', false);
  return count;
};

export const markAsSynced = async (id: number) => {
  const db = await getDB();
  const report = await db.get('reports', id);
  if (report) {
    report.synced = true;
    await db.put('reports', report);
  }
};
