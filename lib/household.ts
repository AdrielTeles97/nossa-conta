import { prisma } from "@/lib/prisma";

export async function getOrCreateHouseholdForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new Error("Usuário não encontrado");

  const householdId = (user as unknown as { householdId: string | null }).householdId;
  if (householdId) {
    const household = await prisma.household.findUnique({ where: { id: householdId } });
    if (household) return household;
  }

  // Cria household pessoal e migra dados legados
  const household = await prisma.household.create({
    data: {
      name: (user as unknown as { name: string | null }).name ? `Família ${(user as unknown as { name: string | null }).name}` : "Meu Household",
      members: { connect: { id: userId } },
    },
  });

  // Migra registros antigos (householdId null) para o novo household
  await Promise.all([
    prisma.income.updateMany({ where: { userId, householdId: null }, data: { householdId: household.id } }),
    prisma.variableExpense.updateMany({ where: { userId, householdId: null }, data: { householdId: household.id } }),
    prisma.fixedExpense.updateMany({ where: { userId, householdId: null }, data: { householdId: household.id } }),
    prisma.asset.updateMany({ where: { userId, householdId: null }, data: { householdId: household.id } }),
    prisma.debt.updateMany({ where: { userId, householdId: null }, data: { householdId: household.id } }),
    prisma.investment.updateMany({ where: { userId, householdId: null }, data: { householdId: household.id } }),
  ]);

  return household;
}

export async function getHouseholdIdForUser(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { householdId: true } }) as unknown as { householdId: string | null } | null;
  if (!user?.householdId) {
    // cria se não existe
    const h = await getOrCreateHouseholdForUser(userId);
    return h.id;
  }
  return user.householdId;
}
