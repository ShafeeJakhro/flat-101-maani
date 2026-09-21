import Decimal from "decimal.js";
import { prisma } from "./db";
import { computeUserBalance, netPairwiseDebts, type DebtEntry } from "./accounting";

/**
 * Get or create the active month
 */
export async function getOrCreateActiveMonth(year: number, month: number) {
  return (prisma as any).month.upsert({
    where: { year_month: { year, month } },
    update: {},
    create: { year, month, status: "ACTIVE" },
  });
}

/**
 * Get current month (today)
 */
export function getCurrentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * Get all expenses in a month with participants
 */
export async function getMonthExpenses(monthId: string) {
  return prisma.expense.findMany({
    where: { monthId } as any,
    include: { participants: true },
  }) as any;
}

/**
 * Compute aggregated debts for a specific month
 * Returns all pairwise debts netted per pair
 */
export async function getMonthPairwiseDebts(monthId: string): Promise<DebtEntry[]> {
  const [expenses, settlements] = await Promise.all([
    getMonthExpenses(monthId),
    (prisma as any).settlement.findMany({ where: { monthId } as any }),
  ]);

  // Build expense debts for this month only
  const debts: DebtEntry[] = [];
  for (const expense of expenses) {
    for (const p of expense.participants) {
      if (p.userId === expense.paidById) continue;
      debts.push({
        fromUserId: p.userId,
        toUserId: expense.paidById,
        amount: new Decimal(p.share.toString()),
      });
    }
  }

  // Settlements act as reverse debts
  const settlementDebts: DebtEntry[] = settlements.map((s: any) => ({
    fromUserId: s.receiverId,
    toUserId: s.payerId,
    amount: new Decimal(s.amount.toString()),
  }));

  return netPairwiseDebts([...debts, ...settlementDebts]);
}

/**
 * User dashboard data for a month
 */
export interface UserMonthDashboard {
  deposit: Decimal;
  expenseShare: Decimal;
  remainingDeposit: Decimal;
  youOwe: { userId: string; username: string; displayName: string; amount: Decimal }[];
  owedToYou: { userId: string; username: string; displayName: string; amount: Decimal }[];
  netPosition: { amount: Decimal; type: "payable" | "receivable" };
}

export async function getUserMonthDashboard(
  monthId: string,
  userId: string
): Promise<UserMonthDashboard> {
  const [month, user, deposit, expenses, pairwiseDebts, users] = await Promise.all([
    (prisma as any).month.findUniqueOrThrow({ where: { id: monthId } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    (prisma as any).deposit.findUnique({ where: { monthId_userId: { monthId, userId } } }),
    getMonthExpenses(monthId),
    getMonthPairwiseDebts(monthId),
    prisma.user.findMany({ where: { isActive: true } }),
  ]);

  // Calculate user's expense share
  let expenseShare = new Decimal(0);
  for (const expense of expenses) {
    const participant = expense.participants.find((p: any) => p.userId === userId);
    if (participant) {
      expenseShare = expenseShare.plus(new Decimal(participant.share.toString()));
    }
  }

  const depositAmount = deposit ? new Decimal(deposit.amount.toString()) : new Decimal(0);
  const remainingDeposit = depositAmount.minus(expenseShare);

  // Find debts involving this user
  const youOwe: UserMonthDashboard["youOwe"] = [];
  const owedToYou: UserMonthDashboard["owedToYou"] = [];

  for (const debt of pairwiseDebts) {
    const userDetails = users.find((u) => u.id === (debt.fromUserId === userId ? debt.toUserId : debt.fromUserId));
    if (!userDetails) continue;

    if (debt.fromUserId === userId) {
      youOwe.push({
        userId: debt.toUserId,
        username: userDetails.username,
        displayName: userDetails.displayName,
        amount: debt.amount,
      });
    } else if (debt.toUserId === userId) {
      owedToYou.push({
        userId: debt.fromUserId,
        username: userDetails.username,
        displayName: userDetails.displayName,
        amount: debt.amount,
      });
    }
  }

  // Calculate net position
  const totalYouOwe = youOwe.reduce((sum, d) => sum.plus(d.amount), new Decimal(0));
  const totalOwedToYou = owedToYou.reduce((sum, d) => sum.plus(d.amount), new Decimal(0));
  const netSettlement = totalOwedToYou.minus(totalYouOwe);

  const dashboard: UserMonthDashboard = {
    deposit: depositAmount,
    expenseShare,
    remainingDeposit,
    youOwe,
    owedToYou,
    netPosition: {
      amount: netSettlement.abs(),
      type: netSettlement.greaterThanOrEqualTo(0) ? "receivable" : "payable",
    },
  };

  return dashboard;
}

/**
 * Get transaction details for a pairwise debt
 */
export interface TransactionDetail {
  expenseId: string;
  title: string;
  amount: Decimal;
  date: Date;
}

export async function getDebtTransactions(
  monthId: string,
  fromUserId: string,
  toUserId: string
): Promise<TransactionDetail[]> {
  const expenses = await getMonthExpenses(monthId);
  const transactions: TransactionDetail[] = [];

  for (const expense of expenses) {
    // Does fromUserId owe toUserId from this expense?
    const participantShare = expense.participants.find((p: any) => p.userId === fromUserId);
    if (participantShare && expense.paidById === toUserId) {
      transactions.push({
        expenseId: expense.id,
        title: expense.title,
        amount: new Decimal(participantShare.share.toString()),
        date: expense.date,
      });
    }
  }

  return transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
}
