export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import Decimal from "decimal.js";

/**
 * GET /api/admin/accounting?monthId=xxx
 * Get complete accounting summary for a month
 * Includes deposits, expenses, settlements, and pairwise debts
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const monthId = searchParams.get("monthId");

    if (!monthId) {
      return NextResponse.json({ error: "monthId required." }, { status: 400 });
    }

    // Get month with all relations
    const month = await (prisma as any).month.findUnique({
      where: { id: monthId },
      include: {
        deposits: { include: { user: { select: { id: true, displayName: true, username: true } } } },
        expenses: {
          include: {
            paidBy: { select: { id: true, displayName: true } },
            participants: { include: { user: { select: { id: true, displayName: true } } } },
          },
        },
        settlements: {
          include: {
            payer: { select: { id: true, displayName: true } },
            receiver: { select: { id: true, displayName: true } },
          },
        },
      },
    });

    if (!month) {
      return NextResponse.json({ error: "Month not found." }, { status: 404 });
    }

    // Get all active users for individual ledgers
    const users = await prisma.user.findMany({ where: { isActive: true } });

    // Calculate totals
    const totalDeposits = month.deposits.reduce(
      (sum: Decimal, d: any) => sum.plus(new Decimal(d.amount.toString())),
      new Decimal(0)
    );

    const totalExpenses = month.expenses.reduce(
      (sum: Decimal, e: any) => sum.plus(new Decimal(e.amount.toString())),
      new Decimal(0)
    );

    const totalSettlements = month.settlements.reduce(
      (sum: Decimal, s: any) => sum.plus(new Decimal(s.amount.toString())),
      new Decimal(0)
    );

    // Build individual ledgers for each user
    const ledgers = users.map((user) => {
      const deposit = month.deposits.find((d: any) => d.userId === user.id);
      const depositAmount = deposit ? new Decimal(deposit.amount.toString()) : new Decimal(0);

      // Calculate expense share
      let expenseShare = new Decimal(0);
      for (const exp of month.expenses) {
        const participant = exp.participants.find((p: any) => p.userId === user.id);
        if (participant) {
          expenseShare = expenseShare.plus(new Decimal(participant.share.toString()));
        }
      }

      const remainingDeposit = depositAmount.minus(expenseShare);

      return {
        userId: user.id,
        displayName: user.displayName,
        username: user.username,
        deposit: depositAmount,
        expenseShare,
        remainingDeposit,
      };
    });

    return NextResponse.json({
      month,
      summary: {
        totalDeposits,
        totalExpenses,
        totalSettlements,
      },
      ledgers,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
