/**
 * localDeviceStore.js
 * ---------------------------------------------------------------------------
 * "Store to phone" for the web. There is no real filesystem access from a
 * browser tab, so the closest honest equivalent to native on-device storage
 * is IndexedDB — it survives refreshes/restarts, holds binary blobs, and
 * isn't wiped the way localStorage can be under storage pressure.
 *
 * Used for two things, per the product spec:
 *   1. Posts from NON-verified users — these never touch Supabase at all.
 *      They live only in this device's IndexedDB and only render in that
 *      same browser/device's own feed.
 *   2. A local cache of chat media (photos/voice notes) so the device that
 *      sent/received them doesn't need to re-download from Supabase Storage
 *      every time. (Cross-device delivery still requires the file to pass
 *      through Supabase Storage once — see the note in MessagesView.jsx —
 *      but after that first transfer, each device keeps its own local copy.)
 *
 * Drop this file anywhere in your src tree, e.g. ./services/localDeviceStore.js
 * ---------------------------------------------------------------------------
 */

const DB_NAME = "glimmacy_device_store";
const DB_VERSION = 1;
const STORES = {
  localPosts: "local_posts",     // unverified users' posts — device-only
  chatMedia: "chat_media_cache", // cached blobs for chat attachments
};

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.localPosts)) {
        db.createObjectStore(STORES.localPosts, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.chatMedia)) {
        db.createObjectStore(STORES.chatMedia, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function withStore(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = fn(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------------------------------------------------------------------
// Local-only posts (unverified users)
// ---------------------------------------------------------------------------
export async function saveLocalPost(post) {
  return withStore(STORES.localPosts, "readwrite", (store) => {
    store.put(post);
    return post;
  });
}

export async function getLocalPosts() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.localPosts, "readonly");
    const store = tx.objectStore(STORES.localPosts);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.created_at - a.created_at));
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalPost(id) {
  return withStore(STORES.localPosts, "readwrite", (store) => {
    store.delete(id);
  });
}

// ---------------------------------------------------------------------------
// Chat media cache (keyed by message id or a temp/local id before upload)
// ---------------------------------------------------------------------------
export async function cacheChatMedia(key, blob, meta = {}) {
  return withStore(STORES.chatMedia, "readwrite", (store) => {
    store.put({ key, blob, meta, cachedAt: Date.now() });
  });
}

export async function getCachedChatMedia(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.chatMedia, "readonly");
    const req = tx.objectStore(STORES.chatMedia).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCachedChatMedia(key) {
  return withStore(STORES.chatMedia, "readwrite", (store) => {
    store.delete(key);
  });
}

// Convenience: turn a cached blob into a usable object URL for <img>/<audio>.
export async function getCachedMediaObjectURL(key) {
  const entry = await getCachedChatMedia(key);
  if (!entry) return null;
  return URL.createObjectURL(entry.blob);
}

// Housekeeping: drop any chat-media cache entries older than `maxAgeMs`
// (call this occasionally, e.g. on app start) to avoid unbounded growth.
export async function pruneOldChatMedia(maxAgeMs = 1000 * 60 * 60 * 24 * 30) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.chatMedia, "readwrite");
    const store = tx.objectStore(STORES.chatMedia);
    const req = store.openCursor();
    const cutoff = Date.now() - maxAgeMs;
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        if (cursor.value.cachedAt < cutoff) cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}