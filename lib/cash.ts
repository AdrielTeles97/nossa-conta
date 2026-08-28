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
  // busca cash inicial deste período (se existir, já está no DB; se não, 0 para cálculo base, mas ensureCash deve ter criado)
  const cash = await prisma.cashBalance.findUnique({ where: { householdId_period: { householdId, period } } });
  const cashInitial = cash ? Number(cash.amount) : 0;

  const where = { householdId };
  const [user, incomes, variables, fixed] = await Promise.all([
    prisma.user.findFirst({ where: { householdId }, select: { investmentTargetPct: true } }),
    prisma.income.findMany({ where: { ...where, OR: [{ isRecurring: true }, { createdAt: { gte: start, lt: end } }] } }),
    prisma.variableExpense.findMany({ where: { ...where, date: { gte: start, lt: end } } }),
    prisma.fixedExpense.findMany({ where }),
  ]);

  const totalIncome = incomes.reduce((a, c) => a + Number(c.value), 0) + cashInitial;
  const totalVar = variables.reduce((a, c) => a + Number(c.value), 0);
  const totalFixed = fixed.reduce((a, c) => a + Number(c.value), 0);
  const investPct = user?.investmentTargetPct ?? 0;
  // investimento incide só sobre receitas "puras"? ou sobre totalIncome com caixa? Usaremos só receitas do mês sem caixa para não reinvestir caixa
  const rawIncome = incomes.reduce((a, c) => a + Number(c.value), 0);
  const invest = rawIncome * (investPct / 100);
  const balance = totalIncome - totalVar - totalFixed - invest;
  return balance;
}

export async function getCashInitial(householdId: string, period: string): Promise<number> {
  const existing = await prisma.cashBalance.findUnique({ where: { householdId_period: { householdId, period } } });
  if (existing) return Number(existing.amount);

  // não existe: calcula saldo do mês anterior e cria registro
  const prev = prevPeriod(period);
  // evita loop infinito: se period é muito antigo e não há dados, retorna 0
  // tenta calcular saldo anterior (que pode recursivamente criar seu próprio cash)
  // para evitar recursão profunda, só calcula um nível: se não há cash anterior, computa saldo anterior sem seu próprio cash (ou com 0)
  // Para cadeia completa, iteramos até 12 meses atrás max
  let prevCash = 0;
  try {
    // tenta garantir que período anterior tenha seu cash criado (recursivo limitado a 1 nível para não estourar)
    const prevPrev = prevPeriod(prev);
    const prevCashRecord = await prisma.cashBalance.findUnique({ where: { householdId_period: { householdId, period: prev } } });
    if (prevCashRecord) {
      prevCash = Number(prevCashRecord.amount);
    } else {
      // computa saldo do anterior sem seu cash (base)
      const { start: ps, end: pe } = periodToDate(prev);
      const where = { householdId };
      const [pUser, pIncomes, pVars, pFixed] = await Promise.all([
        prisma.user.findFirst({ where: { householdId }, select: { investmentTargetPct: true } }),
        prisma.income.findMany({ where: { ...where, OR: [{ isRecurring: true }, { createdAt: { gte: ps, lt: pe } }] } }),
        prisma.variableExpense.findMany({ where: { ...where, date: { gte: ps, lt: pe } } }),
        prisma.fixedExpense.findMany({ where }),
      ]);
      const pRaw = pIncomes.reduce((a, c) => a + Number(c.value), 0);
      const pVar = pVars.reduce((a, c) => a + Number(c.value), 0);
      const pFix = pFixed.reduce((a, c) => a + Number(c.value), 0);
      const pInvest = pRaw * ((pUser?.investmentTargetPct ?? 0) / 100);
      // para o anterior, seu próprio cash inicial é o que estiver no DB (ou 0 se não existe)
      // já pegamos prevCashRecord acima, então usa 0 se não existe
      const prevBalance = pRaw + prevCash - pVar - pFix - pInvest;
      // cria cash para período atual como prevBalance
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
    const pRaw = pIncomes.reduce((a, c) => a + Number(c.value), 0);
    const pVar = pVars.reduce((a, c) => a + Number(c.value), 0);
    const pFix = pFixed.reduce((a, c) => a + Number(c.value), 0);
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
  // não cria automaticamente se amount é 0 e período é futuro? cria mesmo assim para poder editar
  // só cria se amount !== 0 ou se período é próximo (evita poluir)
  if (amount !== 0) {
    try {
      await prisma.cashBalance.create({ data: { householdId, period, amount, userId } });
    } catch {}
  }
  return amount;
}
