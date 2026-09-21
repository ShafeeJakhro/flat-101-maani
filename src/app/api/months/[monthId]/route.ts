export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { writeAuditLog } from "@/lib/audit";

const CloseMonthSchema = z.object({
  monthId: z.string().min(1),
});

/**
 * GET /api/months/[monthId]
 * Get month details with all related data
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ monthId: string }> }
) {
  try {
    await requireAdmin();
    const { monthId } = await params;

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

    return NextResponse.json({ month });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * PATCH /api/months/[monthId]
 * Close a month
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ monthId: string }> }
) {
  try {
    const user = await requireAdmin();
    const { monthId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = CloseMonthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const month = await (prisma as any).month.findUnique({ where: { id: monthId } });
    if (!month) {
      return NextResponse.json({ error: "Month not found." }, { status: 404 });
    }

    if (month.status === "CLOSED") {
      return NextResponse.json({ error: "Month is already closed." }, { status: 400 });
    }

    const updated = await (prisma as any).month.update({
      where: { id: monthId },
      data: { status: "CLOSED" },
    });

    await writeAuditLog({
      action: "EXPENSE_CREATED", // reuse for audit
      actorId: user.id,
      details: `Closed month: ${month.year}-${month.month.toString().padStart(2, "0")}`,
    });

    return NextResponse.json({ month: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
