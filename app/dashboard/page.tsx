// src/app/dashboard/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getOrCreateHouseholdForUser } from '@/lib/household';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, Home, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { MonthPicker } from '@/components/ui/month-picker';

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    const params = await searchParams;
    const period = params.period || new Date().toISOString().slice(0, 7); // YYYY-MM
    const [y, m] = period.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    let totalIncome = 0;
    let totalExpenses = 0;
    let investPlan = 0;
    let balance = 0;
    let netWorth = 0;
    let householdName: string | null = null;
    let incomes: any[] = [];
    let variableExpenses: any[] = [];
    let fixedExpenses: any[] = [];
    let forecast5 = 0;
    let avgSavings = 0;
    let history: { period: string; balance: number }[] = [];
    let cashInitial = 0;

    if (userId) {
        const household = await getOrCreateHouseholdForUser(userId);
        householdName = household.name;
        const where = { householdId: household.id };
        const [user, inc, vars, fixed, assets, debts] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.income.findMany({ where: { ...where, OR: [{ isRecurring: true }, { createdAt: { gte: start, lt: end } }] } }),
            prisma.variableExpense.findMany({ where: { ...where, date: { gte: start, lt: end } } }),
            prisma.fixedExpense.findMany({ where }),
            prisma.asset.findMany({ where }),
            prisma.debt.findMany({ where }),
        ]);
        incomes = inc;
        variableExpenses = vars;
        fixedExpenses = fixed;

        // caixa inicial do mês (saldo anterior editável)
        const cashRec = await prisma.cashBalance.findUnique({ where: { householdId_period: { householdId: household.id, period } } });
        if (cashRec) cashInitial = Number(cashRec.amount);
        else {
          const prevPeriod = new Date(y, m - 2, 1).toISOString().slice(0, 7);
          const prevStart = new Date(y, m - 2, 1);
          const prevEnd = new Date(y, m - 1, 1);
          const prevCashRec = await prisma.cashBalance.findUnique({ where: { householdId_period: { householdId: household.id, period: prevPeriod } } });
          const prevCash = prevCashRec ? Number(prevCashRec.amount) : 0;
          const [prevIncomes, prevVars] = await Promise.all([
            prisma.income.findMany({ where: { householdId: household.id, OR: [{ isRecurring: true }, { createdAt: { gte: prevStart, lt: prevEnd } }] } }),
            prisma.variableExpense.findMany({ where: { householdId: household.id, date: { gte: prevStart, lt: prevEnd } } }),
          ]);
          const prevRaw = prevIncomes.reduce((a, c) => a + Number(c.value), 0);
          const prevVar = prevVars.reduce((a, c) => a + Number(c.value), 0);
          const prevFix = fixed.reduce((a, c) => a + Number(c.value), 0);
          const prevInvest = prevRaw * ((user?.investmentTargetPct ?? 0) / 100);
          const prevBal = prevRaw + prevCash - prevVar - prevFix - prevInvest;
          cashInitial = prevBal > 0 ? prevBal : 0;
        }

        const totalIncomeRaw = incomes.reduce((acc, curr) => acc + Number(curr.value), 0);
        totalIncome = totalIncomeRaw;
        const totalVariables = variableExpenses.reduce((acc, curr) => acc + Number(curr.value), 0);
        const totalFixed = fixedExpenses.reduce((acc, curr) => acc + Number(curr.value), 0);
        totalExpenses = totalVariables + totalFixed;

        const pct = user?.investmentTargetPct ?? 0;
        investPlan = totalIncomeRaw * (pct / 100);
        balance = totalIncomeRaw + cashInitial - totalExpenses - investPlan;

        const totalAssets = assets.reduce((acc, curr) => acc + Number(curr.value), 0);
        const totalDebts = debts.reduce((acc, curr) => acc + Number(curr.balance), 0);
        netWorth = totalAssets - totalDebts;

        // Previsão 5 meses baseada em média dos 2 meses anteriores (guardando)
        for (let i = 1; i <= 2; i++) {
          const pStart = new Date(y, m - 1 - i, 1);
          const pEnd = new Date(y, m - i, 1);
          const pPeriod = pStart.toISOString().slice(0, 7);
          const [pIncomes, pVars] = await Promise.all([
            prisma.income.findMany({ where: { ...where, OR: [{ isRecurring: true }, { createdAt: { gte: pStart, lt: pEnd } }] } }),
            prisma.variableExpense.findMany({ where: { ...where, date: { gte: pStart, lt: pEnd } } }),
          ]);
          const pInc = pIncomes.reduce((a, c) => a + Number(c.value), 0);
          const pVar = pVars.reduce((a, c) => a + Number(c.value), 0);
          const pFixed = totalFixed; // fixas são recorrentes
          const pPct = user?.investmentTargetPct ?? 0;
          const pBal = pInc - pVar - pFixed - (pInc * pPct) / 100;
          history.push({ period: pPeriod, balance: pBal });
        }
        const valid = history.filter((h) => h.balance !== 0);
        if (valid.length > 0) {
          avgSavings = valid.reduce((a, c) => a + c.balance, 0) / valid.length;
          // se guardando positivo há 2 meses, projeta 5 meses
          forecast5 = avgSavings > 0 ? avgSavings * 5 : avgSavings * 5;
        }
    }

    const fmt = (v: number) =>
        (v || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
    const monthLabel = start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const monthShort = start.toLocaleDateString("pt-BR", { month: "long" });

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <p className="text-sm text-[#8A8D82] font-medium">Olá, {session?.user?.name || 'Usuário'}</p>
                    <h2 className="text-2xl font-bold text-[#1B2430] tracking-tight mt-1">Visão geral {householdName ? `— ${householdName}` : ''}</h2>
                    <p className="text-xs text-[#8A8D82] mt-1">
                        Dados sincronizados com seu <Link href="/dashboard/orcamento" className="underline hover:text-[#1B2430]">orçamento</Link> {householdName ? '• compartilhado com sua família' : ''}.
                    </p>
                </div>
                <MonthPicker period={period} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 w-full min-w-0">
                <Card className="bg-[#FBFAF6] border-[#D9D6C9]">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[11px] tracking-widest uppercase font-semibold text-[#1F6F5C] flex items-center gap-1.5">
                            <TrendingUp size={13} /> Receita
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="font-mono text-[22px] font-semibold tracking-tight text-[#1F6F5C]">
                            {fmt(totalIncome)}
                        </div>
                        <div className="text-[10px] text-[#8A8D82] capitalize mt-1">{monthLabel}</div>
                    </CardContent>
                </Card>

                <Card className="bg-[#FBFAF6] border-[#D9D6C9]">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[11px] tracking-widest uppercase font-semibold text-[#B23B3B] flex items-center gap-1.5">
                            <TrendingDown size={13} /> Despesas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="font-mono text-[22px] font-semibold tracking-tight text-[#B23B3B]">
                            {fmt(totalExpenses)}
                        </div>
                        <div className="text-[10px] text-[#8A8D82] capitalize mt-1">{monthLabel}</div>
                    </CardContent>
                </Card>

                <Card className="bg-[#FBFAF6] border-[#D9D6C9]">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[11px] tracking-widest uppercase font-semibold text-[#B8873B] flex items-center gap-1.5">
                            <PiggyBank size={13} /> Aporte
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="font-mono text-[22px] font-semibold tracking-tight text-[#B8873B]">
                            {fmt(investPlan)}
                        </div>
                        <div className="text-[10px] text-[#8A8D82] capitalize mt-1">{monthLabel}</div>
                    </CardContent>
                </Card>

                <Card className="bg-[#FBFAF6] border-[#D9D6C9]">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[11px] tracking-widest uppercase font-semibold text-[#8A8D82] flex items-center gap-1.5">
                            <Wallet size={13} /> Saldo do mês de {monthShort}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className={`font-mono text-[22px] font-semibold tracking-tight ${balance >= 0 ? 'text-[#1B2430]' : 'text-[#B23B3B]'}`}>
                            {fmt(balance)}
                        </div>
                        <div className="text-[10px] text-[#8A8D82] capitalize mt-1">{monthLabel} {cashInitial > 0 ? `• inclui caixa ${fmt(cashInitial)}` : ''}</div>
                    </CardContent>
                </Card>

                <Card className="bg-[#FBFAF6] border-[#D9D6C9]">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[11px] tracking-widest uppercase font-semibold text-[#8A8D82] flex items-center gap-1.5">
                            <Home size={13} /> Patrimônio
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="font-mono text-[22px] font-semibold tracking-tight text-[#1B2430]">
                            {fmt(netWorth)}
                        </div>
                        <div className="text-[10px] text-[#8A8D82] capitalize mt-1">em {monthLabel}</div>
                    </CardContent>
                </Card>
            </div>

            {userId && (
              <Card className="bg-white border-[#D9D6C9] shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  {(() => {
                    const needsTarget = totalIncome * 0.5;
                    const wantsTarget = totalIncome * 0.3;
                    const investTarget = totalIncome * 0.2;
                    const totalVariables = variableExpenses.reduce((a,c)=>a+Number(c.value),0);
                    const totalFixed = fixedExpenses.reduce((a,c)=>a+Number(c.value),0);
                    const needsPct = totalIncome ? (totalFixed / totalIncome) * 100 : 0;
                    const wantsPct = totalIncome ? (totalVariables / totalIncome) * 100 : 0;
                    const investPct = totalIncome ? (investPlan / totalIncome) * 100 : 0;
                    const needsAlert = needsPct > 50;
                    const wantsAlert = wantsPct > 30;
                    const investAlert = investPct < 20 && totalIncome > 0;
                    const ideal5 = investTarget * 5;
                    return (
                      <>
                        <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase font-semibold text-[#1F6F5C]">
                          <Sparkles size={13} /> Regra 50/30/20 + Previsão 5 meses
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                          <div className={`p-3 rounded-xl border ${needsAlert ? 'bg-red-50 border-red-200' : 'bg-[#F1F0EA] border-[#E8E6DD]'}`}>
                            <div className="font-bold">50% Necessidades</div>
                            <div className="mt-1 font-mono">{fmt(totalFixed)} <span className="text-[11px]">({needsPct.toFixed(0)}%)</span></div>
                            <div className="text-[11px] text-[#8A8D82]">ideal {fmt(needsTarget)}</div>
                            {needsAlert && <div className="text-[11px] text-red-600 font-semibold mt-1">Acima do ideal em {fmt(totalFixed - needsTarget)}</div>}
                          </div>
                          <div className={`p-3 rounded-xl border ${wantsAlert ? 'bg-amber-50 border-amber-200' : 'bg-[#F1F0EA] border-[#E8E6DD]'}`}>
                            <div className="font-bold">30% Desejos</div>
                            <div className="mt-1 font-mono">{fmt(totalVariables)} <span className="text-[11px]">({wantsPct.toFixed(0)}%)</span></div>
                            <div className="text-[11px] text-[#8A8D82]">ideal {fmt(wantsTarget)}</div>
                            {wantsAlert && <div className="text-[11px] text-amber-700 font-semibold mt-1">Acima em {fmt(totalVariables - wantsTarget)}</div>}
                          </div>
                          <div className={`p-3 rounded-xl border ${investAlert ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="font-bold">20% Investir</div>
                            <div className="mt-1 font-mono">{fmt(investPlan)} <span className="text-[11px]">({investPct.toFixed(0)}%)</span></div>
                            <div className="text-[11px] text-[#8A8D82]">ideal {fmt(investTarget)}</div>
                            {investAlert && <div className="text-[11px] text-amber-700 font-semibold mt-1">Faltam {fmt(investTarget - investPlan)} para a meta</div>}
                          </div>
                        </div>
                        {(needsAlert || wantsAlert || investAlert) && totalIncome > 0 && (
                          <div className="mt-3 text-xs bg-amber-50 border border-amber-200 rounded-md p-2 text-amber-800">
                            ⚠️ Você está fugindo da regra 50/30/20. Ajuste {needsAlert ? 'necessidades' : ''} {needsAlert && wantsAlert ? ' e ' : ''} {wantsAlert ? 'desejos' : ''} {investAlert ? ' e aumente o aporte' : ''} para voltar ao equilíbrio.
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-between gap-4 border-t pt-3">
                          <div className="text-sm text-[#1B2430]">
                            {avgSavings > 0 ? (
                              <>Guardando em média <b className="text-[#1F6F5C]">{fmt(avgSavings)}</b> (últimos {history.length} meses) → em 5 meses: <b>{fmt(avgSavings * 5)}</b></>
                            ) : (
                              <>Seguindo a regra (20% = {fmt(investTarget)}/mês), em 5 meses: <b className="text-[#1F6F5C]">{fmt(ideal5)}</b> guardados</>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-mono font-bold text-[#1F6F5C]">{fmt(avgSavings > 0 ? avgSavings * 5 : ideal5)}</div>
                            <div className="text-[11px] text-[#8A8D82]">em 5 meses</div>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2 text-[11px] text-[#8A8D82] flex-wrap">
                          {history.map((h) => (
                            <span key={h.period} className="bg-[#F1F0EA] px-2 py-0.5 rounded-full">{h.period}: {fmt(h.balance)}</span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {!userId && (
                <Card className="bg-white border-none shadow-sm rounded-2xl">
                    <CardContent className="p-6 text-center text-sm text-[#8A8D82]">
                        Faça login para ver seus dados reais. Os valores acima refletem o que você cadastra em <Link href="/dashboard/orcamento" className="font-semibold text-[#1F6F5C] underline">Gastos Mensais</Link>.
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
