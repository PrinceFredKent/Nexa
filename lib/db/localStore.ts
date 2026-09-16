import fs from 'fs';
import path from 'path';
import { Session, UserMemory, Note, Message } from '@/lib/types';

interface StoreData {
  sessions: Session[];
  messages: Record<string, Message[]>;
  userMemories: UserMemory[];
  notes: Note[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'nexa-store.json');

const defaultData: StoreData = {
  sessions: [
    {
      id: 'default',
      title: 'General Assistant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  messages: {},
  userMemories: [
    {
      id: 'mem_1',
      category: 'personal',
      content: 'User is Patrick, based in Kampala, Uganda.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  notes: [],
};

let inMemoryCache: StoreData | null = null;

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('[localStore] Failed to create data dir:', err);
  }
}

export function readLocalStore(): StoreData {
  if (inMemoryCache) {
    return inMemoryCache;
  }
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      inMemoryCache = { ...defaultData, ...JSON.parse(raw) };
      return inMemoryCache!;
    }
  } catch (err) {
    console.warn('[localStore] Could not read local store, using in-memory default:', err);
  }
  inMemoryCache = { ...defaultData };
  writeLocalStore(inMemoryCache);
  return inMemoryCache;
}

export function writeLocalStore(data: StoreData): void {
  inMemoryCache = data;
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[localStore] Could not write local store file:', err);
  }
}
