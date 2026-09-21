export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

/**
 * GET /api/me
 * Get current authenticated user info
 */
export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
