import Dexie from "dexie";
import { normalizeTrack } from "../utils/normalizeTrack";

export const offlineDb = new Dexie("wavebox-offline-db");

offlineDb.version(1).stores({
  offlineTracks: "id, title, artist, savedAt",
  playlists: "id, name, updatedAt"
});

export async function getOfflineTracks() {
  const tracks = await offlineDb.offlineTracks.toArray();
  return tracks.map((track) =>
    normalizeTrack(
      {
        ...track,
        audioUrl:
          track.localBlob instanceof Blob ? URL.createObjectURL(track.localBlob) : track.audioUrl
      },
      track.source || "offline"
    )
  );
}

export async function saveOfflineTrack(track, blob) {
  const nextTrack = normalizeTrack(
    {
      ...track,
      isOffline: true,
      source: track.source || "offline",
      audioUrl: URL.createObjectURL(blob)
    },
    track.source || "offline"
  );

  // normalizeTrack only keeps a fixed set of fields, so the blob and savedAt
  // must be attached to the record explicitly — otherwise the audio is never
  // actually stored and the track fails to play after a reload (its audioUrl is
  // a per-session blob: URL that dies with the page).
  await offlineDb.offlineTracks.put({
    ...nextTrack,
    localBlob: blob,
    savedAt: Date.now()
  });
  return nextTrack;
}

export async function removeOfflineTrack(trackId) {
  await offlineDb.offlineTracks.delete(trackId);
}

export async function savePlaylist(playlist) {
  await offlineDb.playlists.put({
    ...playlist,
    updatedAt: Date.now()
  });
}

export async function getPlaylists() {
  return offlineDb.playlists.toArray();
}
