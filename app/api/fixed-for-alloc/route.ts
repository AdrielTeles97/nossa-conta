import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrCreateHouseholdForUser } from "@/lib/household";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json([], { status: 401 });
  const h = await getOrCreateHouseholdForUser(session.user.id);
  const [fixed, variable] = await Promise.all([
    prisma.fixedExpense.findMany({ where: { householdId: h.id }, orderBy: { dueDay: "asc" }, select: { id: true, name: true, value: true, dueDay: true } }),
    prisma.variableExpense.findMany({ where: { householdId: h.id }, orderBy: { date: "desc" }, take: 30, select: { id: true, name: true, value: true, category: true } }),
  ]);
  return Response.json({ fixed, variable });
}
