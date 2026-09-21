export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

const AddDepositSchema = z.object({
  monthId: z.string().min(1),
  userId: z.string().min(1),
  amount: z.union([z.string(), z.number()]).refine((v) => new Decimal(v).greaterThanOrEqualTo(0), {
    message: "Amount must be non-negative.",
  }),
});

/**
 * POST /api/deposits
 * Add or update a deposit for a user in a month
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const parsed = AddDepositSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const { monthId, userId, amount } = parsed.data;

    // Verify month exists and is active
    const month = await (prisma as any).month.findUnique({ where: { id: monthId } });
    if (!month) {
      return NextResponse.json({ error: "Month not found." }, { status: 404 });
    }
    if (month.status !== "ACTIVE") {
      return NextResponse.json({ error: "Cannot add deposits to a closed month." }, { status: 400 });
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || user.role !== "USER") {
      return NextResponse.json({ error: "User not found or not a household member." }, { status: 404 });
    }

    const deposit = await (prisma as any).deposit.upsert({
      where: { monthId_userId: { monthId, userId } },
      update: { amount: new Decimal(amount).toFixed(2) },
      create: {
        monthId,
        userId,
        amount: new Decimal(amount).toFixed(2),
      },
    });

    return NextResponse.json({ deposit }, { status: 200 });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * GET /api/deposits?monthId=xxx
 * Get all deposits for a month
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const monthId = searchParams.get("monthId");

    if (!monthId) {
      return NextResponse.json({ error: "monthId required." }, { status: 400 });
    }

    const deposits = await (prisma as any).deposit.findMany({
      where: { monthId },
      include: { user: { select: { id: true, displayName: true, username: true } } },
    });

    return NextResponse.json({ deposits });
  } catch (err) {
    return handleApiError(err);
  }
}
