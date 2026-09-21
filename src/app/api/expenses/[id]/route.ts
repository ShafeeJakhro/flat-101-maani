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
        { error: "Expense ID is required." },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found." },
        { status: 404 }
      );
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Expense deleted successfully." },
      { status: 200 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
