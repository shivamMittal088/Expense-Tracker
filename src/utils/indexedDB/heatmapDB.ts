import { dbPromise } from "./tilesDB";

const STORE_NAME = "heatmap";

export type CachedHeatmapEntry = {
  date: string;
  count: number;
  totalAmount: number;
};

export async function cacheHeatmapData(year: number, data: CachedHeatmapEntry[]): Promise<void> {
  const idb = await dbPromise;
  await idb.put(STORE_NAME, data, year);
}

export async function getCachedHeatmapData(year: number): Promise<CachedHeatmapEntry[] | undefined> {
  const idb = await dbPromise;
  return idb.get(STORE_NAME, year);
}
