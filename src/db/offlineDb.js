import Dexie from "dexie";

// Everything Josh-Fy keeps lives in this device's IndexedDB — there are no
// accounts, so each device has its own library (Settings can export/import it).
//   kv         -> the persisted library store (likes, playlists, history...)
//   downloads  -> audio blobs saved for offline listening
// The old "offlineTracks"/"playlists" tables are kept in the schema so the
// upgrade can read them once and migrate.
export const db = new Dexie("wavebox-offline-db");

db.version(1).stores({
  offlineTracks: "id, title, artist, savedAt",
  playlists: "id, name, updatedAt"
});

db.version(2).stores({
  offlineTracks: "id, title, artist, savedAt",
  playlists: "id, name, updatedAt",
  kv: "key",
  downloads: "id, savedAt"
});

// zustand `persist` storage adapter backed by the kv table (no 5MB localStorage
// ceiling, so large libraries are fine).
export const idbStorage = {
  getItem: async (name) => (await db.kv.get(name))?.value ?? null,
  setItem: async (name, value) => {
    await db.kv.put({ key: name, value });
  },
  removeItem: async (name) => {
    await db.kv.delete(name);
  }
};

export async function listDownloads() {
  return db.downloads.toArray();
}

export async function getDownloadBlob(id) {
  return (await db.downloads.get(id))?.blob ?? null;
}

export async function putDownload(track, blob) {
  await db.downloads.put({ id: track.id, track, blob, size: blob.size, savedAt: Date.now() });
}

export async function deleteDownload(id) {
  await db.downloads.delete(id);
}

// Moves v1 offline tracks (pre-rebuild downloads/imports) into `downloads`.
// A row is deleted from the old table only after its copy is stored, and rows
// with no audio to move are left alone, so an interrupted or failed upgrade
// never loses anything.
export async function migrateLegacyOfflineTracks(toTrack) {
  const legacy = await db.offlineTracks.toArray();
  for (const record of legacy) {
    if (!(record.localBlob instanceof Blob)) continue;
    try {
      await putDownload(toTrack(record), record.localBlob);
      await db.offlineTracks.delete(record.id);
    } catch {
      /* storage full or blocked: try again next launch */
    }
  }
}
