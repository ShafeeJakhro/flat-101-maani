export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Settlement ID is required." },
        { status: 400 }
      );
    }

    const settlement = await prisma.settlement.findUnique({
      where: { id },
    });

    if (!settlement) {
      return NextResponse.json(
        { error: "Settlement not found." },
        { status: 404 }
      );
    }

    await prisma.settlement.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Settlement deleted successfully." },
      { status: 200 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
