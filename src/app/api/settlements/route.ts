export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

const CreateSettlementSchema = z
  .object({
    payerId: z.string().min(1),
    receiverId: z.string().min(1),
    amount: z.union([z.string(), z.number()]).refine((v) => new Decimal(v).greaterThan(0), {
      message: "Amount must be greater than zero.",
    }),
    date: z.string().min(1),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => d.payerId !== d.receiverId, {
    message: "Payer and receiver must be different people.",
    path: ["receiverId"],
  });

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const parsed = CreateSettlementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { payerId, receiverId, amount, date, notes } = parsed.data;
    const settlementDate = new Date(date);

    if (Number.isNaN(settlementDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid settlement date." },
        { status: 400 }
      );
    }

    const monthRecord = await (prisma as any).month.findUnique({
      where: {
        year_month: {
          year: settlementDate.getFullYear(),
          month: settlementDate.getMonth() + 1,
        },
      },
    });

    if (!monthRecord) {
      return NextResponse.json(
        {
          error:
            "No month exists for the selected settlement date. Start that month first.",
        },
        { status: 400 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: [payerId, receiverId] },
        isActive: true,
        role: "USER",
      },
    });

    if (users.length !== 2) {
      return NextResponse.json(
        { error: "Payer or receiver is invalid or inactive." },
        { status: 400 }
      );
    }

    const settlement = await prisma.settlement.create({
      data: {
        monthId: monthRecord.id,
        payerId,
        receiverId,
        amount: new Decimal(amount).toFixed(2),
        date: settlementDate,
        notes,
      },
    });

    return NextResponse.json({ settlement }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    await requireUser();

    const settlements = await prisma.settlement.findMany({
      include: {
        payer: { select: { id: true, displayName: true } },
        receiver: { select: { id: true, displayName: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ settlements });
  } catch (err) {
    return handleApiError(err);
  }
}
