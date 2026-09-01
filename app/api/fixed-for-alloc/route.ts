import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrCreateHouseholdForUser } from "@/lib/household";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json([], { status: 401 });
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");
  const excludeIncomeId = searchParams.get("excludeIncomeId");
  const h = await getOrCreateHouseholdForUser(session.user.id);
  const [fixed, variable] = await Promise.all([
    prisma.fixedExpense.findMany({ where: { householdId: h.id }, orderBy: { dueDay: "asc" }, select: { id: true, name: true, value: true, dueDay: true } }),
    prisma.variableExpense.findMany({ where: { householdId: h.id }, orderBy: { date: "desc" }, take: 30, select: { id: true, name: true, value: true, category: true } }),
  ]);
  // busca alocações do período para travar duplicidade (inclui legado sem period)
  let allocatedFixed = new Set<string>();
  let allocatedVar = new Set<string>();
  if (period) {
    const allocs = await prisma.incomeAllocation.findMany({
      where: {
        householdId: h.id,
        OR: [{ period }, { period: null }],
        ...(excludeIncomeId ? { NOT: { incomeId: excludeIncomeId } } : {}),
      },
      select: { fixedExpenseId: true, variableExpenseId: true },
    });
    allocatedFixed = new Set(allocs.map((a) => a.fixedExpenseId).filter(Boolean) as string[]);
    allocatedVar = new Set(allocs.map((a) => a.variableExpenseId).filter(Boolean) as string[]);
  }
  return Response.json({
    fixed: fixed.map((f) => ({ ...f, allocated: allocatedFixed.has(f.id) })),
    variable: variable.map((v) => ({ ...v, allocated: allocatedVar.has(v.id) })),
  });
}
