import { openDB } from "idb";

const DB_NAME = "expense-tracker";
const DB_VERSION = 4;
const STORE_NAME = "tiles";

export type CachedTile = {
  _id: string;
  name: string;
  color: string;
  emoji?: string;
  isBuiltIn?: boolean;
};

export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: "_id" });
    }
    if (!db.objectStoreNames.contains("pendingExpenses")) {
      db.createObjectStore("pendingExpenses", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("transactions")) {
      db.createObjectStore("transactions", { keyPath: "_id" });
    }
  },
});

export async function saveTilesToDB(tiles: CachedTile[]): Promise<void> {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.clear();
  for (const tile of tiles) {
    await store.put(tile);
  }
  await tx.done;
}

export async function getTilesFromDB(): Promise<CachedTile[]> {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}
