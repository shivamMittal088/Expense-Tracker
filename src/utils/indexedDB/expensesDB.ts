import { getAccountDB, getActiveAccountId } from "./tilesDB";

const STORE_NAME = "pendingExpenses";

export type PendingExpense = {
  id?: number;
  userId: string;
  amount: number;
  category: { name: string; color: string; emoji: string };
  payment_mode: string;
  notes: string;
  occurredAt: string;
};

export async function savePendingExpense(expense: Omit<PendingExpense, "id" | "userId">, userId = getActiveAccountId()): Promise<void> {
  const db = await getAccountDB(userId);
  await db.add(STORE_NAME, { ...expense, userId });
}

export async function getPendingExpenses(userId = getActiveAccountId()): Promise<PendingExpense[]> {
  const db = await getAccountDB(userId);
  const expenses: PendingExpense[] = await db.getAll(STORE_NAME);
  return expenses.filter((expense) => expense.userId === userId);
}

export async function deletePendingExpense(id: number, userId = getActiveAccountId()): Promise<void> {
  const db = await getAccountDB(userId);
  await db.delete(STORE_NAME, id);
}
