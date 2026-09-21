export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { getMonthPairwiseDebts } from "@/lib/monthly-ledger";
import Decimal from "decimal.js";
import ExcelJS from "exceljs";

/**
 * GET /api/exports/month?monthId=xxx
 * Export month as Excel workbook
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

    // Get pairwise debts
    const pairwiseDebts = await getMonthPairwiseDebts(monthId);

    // Get all users
    const users = await prisma.user.findMany({ where: { isActive: true } });

    // Create workbook
    const workbook = new ExcelJS.Workbook();

    // 1. Monthly Summary Sheet
    const summary = workbook.addWorksheet("Monthly Summary");
    summary.columns = [{ header: "Metric", key: "metric" }, { header: "Amount", key: "amount" }];
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

    const totalOutstandingDebt = pairwiseDebts.reduce(
      (sum: Decimal, debt: any) => sum.plus(debt.amount),
      new Decimal(0)
    );

    summary.addRows([
      { metric: "Month", amount: `${month.year}-${month.month.toString().padStart(2, "0")}` },
      { metric: "Status", amount: month.status },
      { metric: "Total Deposits", amount: totalDeposits.toFixed(2) },
      { metric: "Total Expenses", amount: totalExpenses.toFixed(2) },
      { metric: "Total Settlements", amount: totalSettlements.toFixed(2) },
      { metric: "Total Outstanding Debt", amount: totalOutstandingDebt.toFixed(2) },
    ]);
    summary.getColumn("amount").width = 20;

    // 2. Complete Transactions Sheet
    const transactions = workbook.addWorksheet("Complete Transactions");
    transactions.columns = [
      { header: "Date", key: "date" },
      { header: "Type", key: "type" },
      { header: "Description", key: "description" },
      { header: "Paid By / From", key: "paidBy" },
      { header: "Participants / To", key: "participants" },
      { header: "Amount", key: "amount" },
    ];

    for (const exp of month.expenses) {
      transactions.addRow({
        date: new Date(exp.date).toLocaleDateString(),
        type: "Expense",
        description: exp.title,
        paidBy: exp.paidBy.displayName,
        participants: exp.participants.map((p: any) => p.user.displayName).join(", "),
        amount: new Decimal(exp.amount.toString()).toFixed(2),
      });
    }

    for (const sett of month.settlements) {
      transactions.addRow({
        date: new Date(sett.date).toLocaleDateString(),
        type: "Settlement",
        description: sett.notes || "Settlement",
        paidBy: sett.payer.displayName,
        participants: sett.receiver.displayName,
        amount: new Decimal(sett.amount.toString()).toFixed(2),
      });
    }

    transactions.getColumn("amount").width = 15;

    // 3. Individual Ledgers Sheet
    const ledgers = workbook.addWorksheet("Individual Ledgers");
    ledgers.columns = [
      { header: "Member", key: "member" },
      { header: "Deposit", key: "deposit" },
      { header: "Expense Share", key: "expenseShare" },
      { header: "Remaining Deposit", key: "remainingDeposit" },
    ];

    for (const user of users) {
      const deposit = month.deposits.find((d: any) => d.userId === user.id);
      const depositAmount = deposit ? new Decimal(deposit.amount.toString()) : new Decimal(0);

      let expenseShare = new Decimal(0);
      for (const exp of month.expenses) {
        const participant = exp.participants.find((p: any) => p.userId === user.id);
        if (participant) {
          expenseShare = expenseShare.plus(new Decimal(participant.share.toString()));
        }
      }

      const remainingDeposit = depositAmount.minus(expenseShare);

      ledgers.addRow({
        member: user.displayName,
        deposit: depositAmount.toFixed(2),
        expenseShare: expenseShare.toFixed(2),
        remainingDeposit: remainingDeposit.toFixed(2),
      });
    }

    ledgers.columns.forEach((col) => {
      col.width = 18;
    });

    // 4. Deposits Sheet
    const deposits = workbook.addWorksheet("Deposits");
    deposits.columns = [
      { header: "Member", key: "member" },
      { header: "Deposit Amount", key: "amount" },
    ];

    for (const dep of month.deposits) {
      deposits.addRow({
        member: dep.user.displayName,
        amount: new Decimal(dep.amount.toString()).toFixed(2),
      });
    }

    deposits.getColumn("amount").width = 18;

    // 5. Who Owes Whom Sheet
    const debts = workbook.addWorksheet("Who Owes Whom");
    debts.columns = [
      { header: "From", key: "from" },
      { header: "To", key: "to" },
      { header: "Amount", key: "amount" },
    ];

    for (const debt of pairwiseDebts) {
      const fromUser = users.find((u) => u.id === debt.fromUserId);
      const toUser = users.find((u) => u.id === debt.toUserId);
      if (fromUser && toUser) {
        debts.addRow({
          from: fromUser.displayName,
          to: toUser.displayName,
          amount: debt.amount.toFixed(2),
        });
      }
    }

    debts.addRow({
      from: "TOTAL OUTSTANDING",
      to: "",
      amount: totalOutstandingDebt.toFixed(2),
    });

    debts.getColumn("amount").width = 18;

    // 6. Final Settlement Sheet
    const settlement = workbook.addWorksheet("Final Settlement");
    settlement.columns = [
      { header: "Debtor", key: "debtor" },
      { header: "Creditor", key: "creditor" },
      { header: "Amount", key: "amount" },
    ];

    for (const debt of pairwiseDebts) {
      const debtor = users.find((u) => u.id === debt.fromUserId);
      const creditor = users.find((u) => u.id === debt.toUserId);
      if (debtor && creditor) {
        settlement.addRow({
          debtor: debtor.displayName,
          creditor: creditor.displayName,
          amount: debt.amount.toFixed(2),
        });
      }
    }

    settlement.getColumn("amount").width = 18;

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as downloadable file
    const filename = `monthly_report_${month.year}-${month.month.toString().padStart(2, "0")}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
