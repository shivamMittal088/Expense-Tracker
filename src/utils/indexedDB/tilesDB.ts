import { openDB } from "idb";

const DB_VERSION = 5;
const STORE_NAME = "tiles";
const databases = new Map<string, ReturnType<typeof openDB>>();

export type CachedTile = {
  _id: string;
  name: string;
  color: string;
  emoji?: string;
  isBuiltIn?: boolean;
};

export const getActiveAccountId = (): string => {
  const raw = localStorage.getItem("userProfile");
  if (!raw || localStorage.getItem("isLoggedIn") !== "true") return "";
  try {
    const profile = JSON.parse(raw) as { _id?: unknown };
    return typeof profile._id === "string" ? profile._id : "";
  } catch {
    return "";
  }
};

// The legacy shared database has no reliable owner. Never import its records
// into a signed-in account; retain it untouched instead of guessing ownership.
export const getAccountDB = (accountId = getActiveAccountId()) => {
  if (!accountId) throw new Error("Sign in before accessing offline data");
  const existing = databases.get(accountId);
  if (existing) return existing;
  const database = openDB(`expense-tracker:user:${accountId}`, DB_VERSION, {
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
      if (!db.objectStoreNames.contains("heatmap")) {
        db.createObjectStore("heatmap");
      }
    },
  });
  databases.set(accountId, database);
  void database.catch(() => databases.delete(accountId));
  return database;
};

export async function saveTilesToDB(tiles: CachedTile[]): Promise<void> {
  const db = await getAccountDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.clear();
  for (const tile of tiles) {
    await store.put(tile);
  }
  await tx.done;
}

export async function getTilesFromDB(): Promise<CachedTile[]> {
  const db = await getAccountDB();
  return db.getAll(STORE_NAME);
}
