export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { getUserMonthDashboard } from "@/lib/monthly-ledger";

/**
 * GET /api/user/dashboard?monthId=xxx
 * Get user's dashboard data for a specific month
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const monthId = searchParams.get("monthId");

    if (!monthId) {
      return NextResponse.json({ error: "monthId required." }, { status: 400 });
    }

    // Verify month exists
    const month = await (prisma as any).month.findUnique({ where: { id: monthId } });
    if (!month) {
      return NextResponse.json({ error: "Month not found." }, { status: 404 });
    }

    const dashboard = await getUserMonthDashboard(monthId, user.id);
    return NextResponse.json({ dashboard, month });
  } catch (err) {
    return handleApiError(err);
  }
}
