export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { getDebtTransactions } from "@/lib/monthly-ledger";

/**
 * GET /api/transactions?monthId=xxx&fromUserId=xxx&toUserId=xxx
 * Get all transactions (bills) that make up a debt between two users
 * Supports "me" as a placeholder for current user
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const monthId = searchParams.get("monthId");
    let fromUserId = searchParams.get("fromUserId");
    let toUserId = searchParams.get("toUserId");

    // Replace "me" with actual user id
    if (fromUserId === "me") fromUserId = user.id;
    if (toUserId === "me") toUserId = user.id;

    if (!monthId || !fromUserId || !toUserId) {
      return NextResponse.json(
        { error: "monthId, fromUserId, toUserId required." },
        { status: 400 }
      );
    }

    // Verify user is either fromUserId or toUserId (can only see own transactions)
    if (user.id !== fromUserId && user.id !== toUserId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    // Verify month exists
    const month = await (prisma as any).month.findUnique({
      where: { id: monthId },
    });
    if (!month) {
      return NextResponse.json({ error: "Month not found." }, { status: 404 });
    }

    // Get users involved
    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: fromUserId } }),
      prisma.user.findUnique({ where: { id: toUserId } }),
    ]);

    if (!fromUser || !toUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Get transactions
    const transactions = await getDebtTransactions(monthId, fromUserId, toUserId);

    return NextResponse.json({
      transactions,
      fromUser: { id: fromUser.id, displayName: fromUser.displayName, username: fromUser.username },
      toUser: { id: toUser.id, displayName: toUser.displayName, username: toUser.username },
      month,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
