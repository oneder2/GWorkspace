import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const databasePath = process.env.DATABASE_PATH ?? "./data/gellaria.db";
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS signals (
    landmark_id TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS visitor_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL,
    landmark_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tags (
    landmark_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (landmark_id, tag)
  );
  CREATE TABLE IF NOT EXISTS visitor_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL,
    landmark_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

const readSignals = db.prepare<[], { landmark_id: string; count: number }>(
  "SELECT landmark_id, count FROM signals",
);
const incrementSignal = db.prepare<[string]>(`
  INSERT INTO signals (landmark_id, count) VALUES (?, 1)
  ON CONFLICT(landmark_id) DO UPDATE SET count = count + 1
`);
const insertAction = db.prepare<[string, string, number]>(
  "INSERT INTO visitor_actions (visitor_id, landmark_id, created_at) VALUES (?, ?, ?)",
);
const recentAction = db.prepare<[string, string, number], { total: number }>(`
  SELECT COUNT(*) AS total FROM visitor_actions
  WHERE visitor_id = ? AND landmark_id = ? AND created_at > ?
`);
const readSignal = db.prepare<[string], { count: number }>(
  "SELECT count FROM signals WHERE landmark_id = ?",
);
const readTags = db.prepare<[], { landmark_id: string; tag: string; count: number }>(
  "SELECT landmark_id, tag, count FROM tags",
);
const incrementTag = db.prepare<[string, string]>(`
  INSERT INTO tags (landmark_id, tag, count) VALUES (?, ?, 1)
  ON CONFLICT(landmark_id, tag) DO UPDATE SET count = count + 1
`);
const insertTagAction = db.prepare<[string, string, string, number]>(
  "INSERT INTO visitor_tags (visitor_id, landmark_id, tag, created_at) VALUES (?, ?, ?, ?)",
);
const recentTag = db.prepare<[string, string, number], { total: number }>(`
  SELECT COUNT(*) AS total FROM visitor_tags
  WHERE visitor_id = ? AND landmark_id = ? AND created_at > ?
`);
const readTag = db.prepare<[string, string], { count: number }>(
  "SELECT count FROM tags WHERE landmark_id = ? AND tag = ?",
);

export function getSignals() {
  return Object.fromEntries(readSignals.all().map((row) => [row.landmark_id, row.count]));
}

export function getTags() {
  const result: Record<string, Record<string, number>> = {};
  for (const row of readTags.all()) {
    result[row.landmark_id] ??= {};
    result[row.landmark_id][row.tag] = row.count;
  }
  return result;
}

export function addSignal(visitorId: string, landmarkId: string) {
  const since = Date.now() - 30_000;
  if (recentAction.get(visitorId, landmarkId, since)?.total) return null;

  db.transaction(() => {
    incrementSignal.run(landmarkId);
    insertAction.run(visitorId, landmarkId, Date.now());
  })();
  return readSignal.get(landmarkId)?.count ?? 1;
}

export function addTag(visitorId: string, landmarkId: string, tag: string) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  if (recentTag.get(visitorId, landmarkId, since)?.total) return null;

  db.transaction(() => {
    incrementTag.run(landmarkId, tag);
    insertTagAction.run(visitorId, landmarkId, tag, Date.now());
  })();
  return readTag.get(landmarkId, tag)?.count ?? 1;
}
