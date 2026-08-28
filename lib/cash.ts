import { prisma } from "@/lib/prisma";

function periodToDate(period: string) {
  const [y, m] = period.split("-").map(Number);
  return { y, m, start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}
function prevPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return d.toISOString().slice(0, 7);
}

export async function computeBalanceForPeriod(householdId: string, period: string): Promise<number> {
  const { start, end } = periodToDate(period);
  const cash = await prisma.cashBalance.findUnique({ where: { householdId_period: { householdId, period } } });
  const cashInitial = cash ? Number(cash.amount) : 0;

  const where = { householdId };
  const [user, incomes, variables, fixed] = await Promise.all([
    prisma.user.findFirst({ where: { householdId }, select: { investmentTargetPct: true } }),
    prisma.income.findMany({ where: { ...where, OR: [{ isRecurring: true }, { createdAt: { gte: start, lt: end } }] } }),
    prisma.variableExpense.findMany({ where: { ...where, date: { gte: start, lt: end } } }),
    prisma.fixedExpense.findMany({ where }),
  ]);

  const totalIncome = incomes.reduce((a: number, c: any) => a + Number(c.value), 0) + cashInitial;
  const totalVar = variables.reduce((a: number, c: any) => a + Number(c.value), 0);
  const totalFixed = fixed.reduce((a: number, c: any) => a + Number(c.value), 0);
  const investPct = user?.investmentTargetPct ?? 0;
  const rawIncome = incomes.reduce((a: number, c: any) => a + Number(c.value), 0);
  const invest = rawIncome * (investPct / 100);
  const balance = totalIncome - totalVar - totalFixed - invest;
  return balance;
}

export async function getCashInitial(householdId: string, period: string): Promise<number> {
  const existing = await prisma.cashBalance.findUnique({ where: { householdId_period: { householdId, period } } });
  if (existing) return Number(existing.amount);

  const prev = prevPeriod(period);
  let prevCash = 0;
  try {
    const prevCashRecord = await prisma.cashBalance.findUnique({ where: { householdId_period: { householdId, period: prev } } });
    if (prevCashRecord) {
      prevCash = Number(prevCashRecord.amount);
    } else {
      const { start: ps, end: pe } = periodToDate(prev);
      const where = { householdId };
      const [pUser, pIncomes, pVars, pFixed] = await Promise.all([
        prisma.user.findFirst({ where: { householdId }, select: { investmentTargetPct: true } }),
        prisma.income.findMany({ where: { ...where, OR: [{ isRecurring: true }, { createdAt: { gte: ps, lt: pe } }] } }),
        prisma.variableExpense.findMany({ where: { ...where, date: { gte: ps, lt: pe } } }),
        prisma.fixedExpense.findMany({ where }),
      ]);
      const pRaw = pIncomes.reduce((a: number, c: any) => a + Number(c.value), 0);
      const pVar = pVars.reduce((a: number, c: any) => a + Number(c.value), 0);
      const pFix = pFixed.reduce((a: number, c: any) => a + Number(c.value), 0);
      const pInvest = pRaw * ((pUser?.investmentTargetPct ?? 0) / 100);
      const prevBalance = pRaw + prevCash - pVar - pFix - pInvest;
      return prevBalance;
    }
    const { start: ps, end: pe } = periodToDate(prev);
    const where = { householdId };
    const [pUser, pIncomes, pVars, pFixed] = await Promise.all([
      prisma.user.findFirst({ where: { householdId }, select: { investmentTargetPct: true } }),
      prisma.income.findMany({ where: { ...where, OR: [{ isRecurring: true }, { createdAt: { gte: ps, lt: pe } }] } }),
      prisma.variableExpense.findMany({ where: { ...where, date: { gte: ps, lt: pe } } }),
      prisma.fixedExpense.findMany({ where }),
    ]);
    const pRaw = pIncomes.reduce((a: number, c: any) => a + Number(c.value), 0);
    const pVar = pVars.reduce((a: number, c: any) => a + Number(c.value), 0);
    const pFix = pFixed.reduce((a: number, c: any) => a + Number(c.value), 0);
    const pInvest = pRaw * ((pUser?.investmentTargetPct ?? 0) / 100);
    const prevBalance = pRaw + prevCash - pVar - pFix - pInvest;
    return prevBalance;
  } catch {
    return 0;
  }
}

export async function ensureCashForPeriod(householdId: string, period: string, userId: string): Promise<number> {
  const existing = await prisma.cashBalance.findUnique({ where: { householdId_period: { householdId, period } } });
  if (existing) return Number(existing.amount);
  const amount = await getCashInitial(householdId, period);
  if (amount !== 0) {
    try {
      await prisma.cashBalance.create({ data: { householdId, period, amount, userId } });
    } catch {}
  }
  return amount;
}
