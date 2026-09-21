export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentMonth } from "@/lib/monthly-ledger";

const StartMonthSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
});

const AddDepositSchema = z.object({
  monthId: z.string().min(1),
  userId: z.string().min(1),
  amount: z.union([z.string(), z.number()]).refine((v) => new Decimal(v).greaterThanOrEqualTo(0), {
    message: "Amount must be non-negative.",
  }),
});

const CloseMonthSchema = z.object({
  monthId: z.string().min(1),
});

/**
 * GET /api/months
 * List all months, optionally filtered by status
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const months = await (prisma as any).month.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        deposits: { include: { user: { select: { id: true, displayName: true, username: true } } } },
        expenses: { include: { paidBy: { select: { displayName: true } } } },
      },
     orderBy: [{ year: "desc" }, { month: "desc" }], 
    });

    return NextResponse.json({ months });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/months
 * Start a new month
 */
export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const body = await request.json().catch(() => null);
    const parsed = StartMonthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const { year, month } = parsed.data;

    // Check if month already exists
    const existing = await (prisma as any).month.findUnique({
      where: { year_month: { year, month } },
    });

    if (existing) {
      return NextResponse.json({ error: "Month already exists." }, { status: 409 });
    }

    const monthRecord = await (prisma as any).month.create({
      data: { year, month, status: "ACTIVE" },
    });

    await writeAuditLog({
      action: "EXPENSE_CREATED", // reuse for audit trail
      actorId: user.id,
      details: `Started new month: ${year}-${month.toString().padStart(2, "0")}`,
    });

    return NextResponse.json({ month: monthRecord }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
