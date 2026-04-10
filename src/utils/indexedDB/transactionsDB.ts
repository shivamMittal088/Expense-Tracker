import { dbPromise } from "./tilesDB";

const STORE_NAME = "transactions";
const MAX_CACHED = 100;

export type CachedTransaction = {
  _id: string;
  amount: number;
  category: { name: string; color: string; emoji?: string };
  notes?: string;
  occurredAt: string;
  payment_mode: string;
};

export async function cacheTransactions(transactions: CachedTransaction[]): Promise<void> {
  const idb = await dbPromise;
  const tx = idb.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.clear();
  const limited = transactions.slice(0, MAX_CACHED);
  for (const t of limited) {
    await store.put(t);
  }
  await tx.done;
}

export async function appendCachedTransactions(transactions: CachedTransaction[]): Promise<void> {
  const idb = await dbPromise;
  const tx = idb.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const existingCount = await store.count();
  const remaining = Math.max(0, MAX_CACHED - existingCount);
  const limited = transactions.slice(0, remaining);
  for (const t of limited) {
    await store.put(t);
  }
  await tx.done;
}

export async function getCachedTransactions(): Promise<CachedTransaction[]> {
  const idb = await dbPromise;
  return idb.getAll(STORE_NAME);
}
