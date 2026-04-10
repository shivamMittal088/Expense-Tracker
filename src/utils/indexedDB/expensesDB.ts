import { dbPromise } from "./tilesDB";

const STORE_NAME = "pendingExpenses";

export type PendingExpense = {
  id?: number;
  amount: number;
  category: { name: string; color: string; emoji: string };
  payment_mode: string;
  notes: string;
  occurredAt: string;
};

export async function savePendingExpense(expense: Omit<PendingExpense, "id">): Promise<void> {
  const db = await dbPromise;
  await db.add(STORE_NAME, expense);
}

export async function getPendingExpenses(): Promise<PendingExpense[]> {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

export async function deletePendingExpense(id: number): Promise<void> {
  const db = await dbPromise;
  await db.delete(STORE_NAME, id);
}
