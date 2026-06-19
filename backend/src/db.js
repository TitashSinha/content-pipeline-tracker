// Tiny JSON-file datastore. The whole DB lives in memory and is flushed to
// disk on every write. At this scale (a handful of users, dozens of articles)
// that is more than fast enough and keeps the data layer transparent.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'db.json');

const emptyDB = () => ({
  users: [],
  clients: [],
  articleTypes: [],
  articles: [],
  activityLogs: [],
  archivedUsers: [], // "bin" for removed writers
});

let db = emptyDB();

/** Load the DB from disk into memory (called once on boot). */
export function load() {
  if (existsSync(DB_PATH)) {
    db = JSON.parse(readFileSync(DB_PATH, 'utf8'));
    // Backfill any collections added in later versions (e.g. archivedUsers).
    for (const key of Object.keys(emptyDB())) if (!db[key]) db[key] = [];
    // Migrate the old single googleDocLink → referenceLinks array.
    for (const a of db.articles) {
      if (!a.referenceLinks) a.referenceLinks = a.googleDocLink ? [a.googleDocLink] : [];
    }
    // Backfill richer client fields added in later versions.
    for (const c of db.clients) {
      if (!('contentTypeId' in c)) c.contentTypeId = null;
      if (!c.sampleLinks) c.sampleLinks = [];
    }
  }
  return db;
}

/** Flush the in-memory DB to disk. */
export function persist() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

/** Live reference to the in-memory DB. Mutate, then call persist(). */
export function getDB() {
  return db;
}

/** Replace the whole DB (used by the seeder) and write it out. */
export function replaceAll(next) {
  db = next;
  persist();
}

/** Next auto-increment id for a collection. */
export function nextId(collection) {
  return db[collection].reduce((max, row) => Math.max(max, row.id), 0) + 1;
}
