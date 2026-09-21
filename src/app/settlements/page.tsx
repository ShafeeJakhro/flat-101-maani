import { redirect } from "next/navigation";
import Decimal from "decimal.js";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NavBar } from "@/components/NavBar";
import { SettlementForm } from "@/components/SettlementForm";
import { SettlementHistory } from "@/components/SettlementHistory";

export default async function SettlementsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/my-expenses");

  const [users, settlements] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true }, orderBy: { displayName: "asc" } }),
    prisma.settlement.findMany({
      orderBy: { date: "desc" },
      include: { payer: { select: { displayName: true } }, receiver: { select: { displayName: true } } },
    }),
  ]);

  // Serialize Decimal to string for client component
  const serializedSettlements = settlements.map((s) => ({
    ...s,
    amount: s.amount.toString(),
    date: s.date.toISOString(),
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="pb-24">
      <NavBar displayName={user.displayName} role={user.role} />
      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <h1 className="text-lg font-bold text-slate-900">Record Settlement</h1>
        <SettlementForm users={users.map((u: any) => ({ id: u.id, displayName: u.displayName }))} />

        <SettlementHistory settlements={serializedSettlements as any[]} />
      </main>
    </div>
  );
}
