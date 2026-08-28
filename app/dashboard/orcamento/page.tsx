// src/app/dashboard/orcamento/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrCreateHouseholdForUser } from "@/lib/household";
import { deleteIncome, deleteFixedExpense, deleteVariableExpense, toggleFixedExpense } from "@/app/actions/budget";
import { Card, CardContent } from "@/components/ui/card";
import { IncomeModal } from "@/app/dashboard/_components/modals/IncomeModal";
import { FixedExpenseModal } from "@/app/dashboard/_components/modals/FixedExpenseModal";
import { VariableExpenseModal } from "@/app/dashboard/_components/modals/VariableExpenseModal";
import { InvestPlanModal } from "@/app/dashboard/_components/modals/InvestPlanModal";
import { BudgetChart } from "@/app/dashboard/_components/modals/BudgetChart";
import { HouseholdShareCard } from "@/app/dashboard/_components/HouseholdShareCard";
import { CategoryManager } from "@/components/ui/category-manager";
import { Eye, Trash2, Filter, Clock, CheckCircle2, Circle, Link2, Calendar, Wallet } from "lucide-react";
import Link from "next/link";
import { MonthPicker } from "@/components/ui/month-picker";
import { CashBalanceCard } from "@/components/ui/cash-balance-card";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  
  const params = await searchParams;
  const currentTab = params.tab || "receita";
  const period = params.period || new Date().toISOString().slice(0, 7);
  const [py, pm] = period.split("-").map(Number);
  const start = new Date(py, pm - 1, 1);
  const end = new Date(py, pm, 1);
  const monthLabel = start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const monthShort = start.toLocaleDateString("pt-BR", { month: "long" });
  // link helper para preservar periodo ao trocar aba
  const tabHref = (tab: string) => `?tab=${tab}&period=${period}`;

  // Escopo por household (casal compartilha dados)
  let householdId: string | null = null;
  let household = null as Awaited<ReturnType<typeof getOrCreateHouseholdForUser>> | null;
  if (userId) {
    household = await getOrCreateHouseholdForUser(userId);
    householdId = household.id;
  }

  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  const baseWhere = householdId ? { householdId } : userId ? { userId } : null;
  // Fixas são recorrentes: aparecem todo mês automaticamente (não filtra por período)
  // Receitas: se isRecurring=true aparece todo mês, senão filtra por período
  const incomes = baseWhere
    ? await prisma.income.findMany({
        where: {
          ...baseWhere,
          OR: [{ isRecurring: true }, { createdAt: { gte: start, lt: end } }],
        },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      })
    : [];
  const variableExpenses = baseWhere ? await prisma.variableExpense.findMany({ where: { ...baseWhere, date: { gte: start, lt: end } }, orderBy: { date: "desc" }, include: { user: { select: { name: true } } } }) : [];
  const fixedExpenses = baseWhere ? await prisma.fixedExpense.findMany({ where: baseWhere, orderBy: { dueDay: "asc" }, include: { user: { select: { name: true } }, linkedDebt: { select: { id: true, name: true } } } }) : [];

  // Caixa inicial = saldo livre do mês anterior (editável)
  let cashInitial = 0;
  if (householdId) {
    const cashRec = await prisma.cashBalance.findUnique({ where: { householdId_period: { householdId, period } } });
    if (cashRec) {
      cashInitial = Number(cashRec.amount);
    } else {
      const prevPeriod = new Date(py, pm - 2, 1).toISOString().slice(0, 7);
      const prevStart = new Date(py, pm - 2, 1);
      const prevEnd = new Date(py, pm - 1, 1);
      const prevCashRec = await prisma.cashBalance.findUnique({ where: { householdId_period: { householdId, period: prevPeriod } } });
      const prevCash = prevCashRec ? Number(prevCashRec.amount) : 0;
      const [prevIncomes, prevVars] = baseWhere
        ? await Promise.all([
            prisma.income.findMany({ where: { ...baseWhere, OR: [{ isRecurring: true }, { createdAt: { gte: prevStart, lt: prevEnd } }] } }),
            prisma.variableExpense.findMany({ where: { ...baseWhere, date: { gte: prevStart, lt: prevEnd } } }),
          ])
        : [[], []];
      const prevRaw = prevIncomes.reduce((a, c) => a + Number((c as any).value), 0);
      const prevVar = prevVars.reduce((a, c) => a + Number((c as any).value), 0);
      const prevFix = fixedExpenses.reduce((a, c) => a + Number(c.value), 0);
      const prevInvest = prevRaw * ((user?.investmentTargetPct ?? 0) / 100);
      const prevBalance = prevRaw + prevCash - prevVar - prevFix - prevInvest;
      cashInitial = prevBalance > 0 ? prevBalance : 0;
      // não persiste automaticamente; usuário pode editar e salvar
    }
  }

  // Matemática dos Cards (com caixa)
  const totalIncomeRaw = incomes.reduce((acc, curr) => acc + Number(curr.value), 0);
  const totalIncomeAvailable = totalIncomeRaw + cashInitial;
  const totalVariables = variableExpenses.reduce((acc, curr) => acc + Number(curr.value), 0);
  const totalFixed = fixedExpenses.reduce((acc, curr) => acc + Number(curr.value), 0);
  
  const totalExpenses = totalVariables + totalFixed;
  const investTargetPct = user?.investmentTargetPct || 0;
  const investAmount = totalIncomeRaw * (investTargetPct / 100);
  const balance = totalIncomeAvailable - totalExpenses - investAmount;
  // para compatibilidade com cards antigos, totalIncome exibido é o raw; total para saldo é available
  const totalIncome = totalIncomeRaw;

  const fmt = (v: any) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const activeTabClass = "px-4 py-2 bg-white rounded-full text-sm font-bold text-[#1B2430] shadow-sm";
  const inactiveTabClass = "px-4 py-2 text-sm font-semibold text-[#8A8D82] hover:bg-[#E8E6DD] rounded-full transition-colors";

  return (
    <div className="space-y-6">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[#8A8D82] font-medium">Olá, {session?.user?.name || "Usuário"}</p>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-2xl font-bold text-[#1B2430] tracking-tight">Gastos Mensais</h2>
            <Eye size={18} className="text-[#8A8D82] cursor-pointer hover:text-[#1B2430] transition-colors" />
          </div>
          <p className="text-xs text-[#8A8D82] mt-1 capitalize flex items-center gap-1.5"><Calendar size={12}/> {monthLabel} {household ? <>• {household.name} • <span className="font-mono">{household.inviteCode.slice(0,8)}…</span></> : null}</p>
        </div>
        <MonthPicker period={period} />
      </div>

      {householdId && <HouseholdShareCard householdId={householdId} inviteCode={household!.inviteCode} />}

      {householdId && <CashBalanceCard period={period} amount={cashInitial} monthLabel={monthLabel} />}
      
      {/* --- 4 CARDS DE RESUMO --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        <Card className="bg-white border-none shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">$</div>
              <span className="text-xs font-bold text-[#8A8D82] uppercase tracking-widest">Receita em {monthShort}</span>
            </div>
            <span className="text-2xl font-bold text-[#1F6F5C]">{fmt(totalIncome)}</span>
            <span className="text-[10px] text-[#8A8D82] capitalize mt-1">{monthLabel} • recorrência mensal</span>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-none shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-center relative">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs">📈</div>
                <span className="text-xs font-bold text-[#8A8D82] uppercase tracking-widest">Investir em {monthShort}</span>
              </div>
              <InvestPlanModal currentPct={investTargetPct} totalIncome={totalIncome} />
            </div>
            <span className="text-2xl font-bold text-blue-600">{fmt(investAmount)}</span>
            <span className="text-[10px] text-[#8A8D82] capitalize mt-1">{monthLabel}</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-xs">📄</div>
              <span className="text-xs font-bold text-[#8A8D82] uppercase tracking-widest">Despesas em {monthShort}</span>
            </div>
            <span className="text-2xl font-bold text-[#B23B3B]">{fmt(totalExpenses)}</span>
            <span className="text-[10px] text-[#8A8D82] mt-1">Fixas trazidas automaticamente • variáveis de {monthShort}</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-xs font-bold">✨</div>
              <span className="text-xs font-bold text-[#8A8D82] uppercase tracking-widest">Saldo Livre em {monthShort}</span>
            </div>
            <span className={`text-2xl font-bold ${balance >= 0 ? 'text-[#1B2430]' : 'text-[#B23B3B]'}`}>{fmt(balance)}</span>
            <span className="text-[10px] text-[#8A8D82] capitalize mt-1">{monthLabel} {cashInitial > 0 ? `• inclui caixa ${fmt(cashInitial)}` : '• sem caixa anterior'}</span>
          </CardContent>
        </Card>
      </div>

      {/* --- ABAS DE NAVEGAÇÃO --- */}
      <div className="flex gap-2 mb-2">
        <Link href={tabHref("receita")} className={currentTab === "receita" ? activeTabClass : inactiveTabClass}>
          Receita
        </Link>
        <Link href={tabHref("fixa")} className={currentTab === "fixa" ? activeTabClass : inactiveTabClass}>
          Despesa fixa
        </Link>
        <Link href={tabHref("variavel")} className={currentTab === "variavel" ? activeTabClass : inactiveTabClass}>
          Despesa variável
        </Link>
      </div>

      {/* --- ÁREA PRINCIPAL (TABELA + GRÁFICO) --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full min-w-0">
        
        {/* Tabela (Ocupa 2 colunas no grid) */}
        <Card className="bg-white border-none shadow-sm rounded-2xl col-span-1 xl:col-span-2 overflow-hidden min-h-[380px] w-full min-w-0">
          <div className="p-5 border-b border-[#F1F0EA] flex items-center justify-between flex-wrap gap-4">
            <h3 className="font-bold text-[#1B2430] text-lg capitalize">
              {currentTab === "fixa" ? "Despesa Fixa" : currentTab === "variavel" ? "Despesa Variável" : "Receita"}
            </h3>
            <div className="flex items-center gap-2">
              <CategoryManager />
              <button className="flex items-center gap-2 text-xs font-semibold text-[#4A5160] px-3 py-2 bg-white border border-[#D9D6C9] rounded-lg hover:bg-gray-50 transition-colors">
                <Filter size={14} /> Filtro
              </button>
              
              {/* O Modal se adapta à aba atual */}
              {currentTab === "receita" && <IncomeModal />}
              {currentTab === "fixa" && <FixedExpenseModal />}
              {currentTab === "variavel" && <VariableExpenseModal />}
            </div>
          </div>
          
          <div className="p-0 overflow-x-auto w-full max-w-full">
            
            {/* --- TABELA DE RECEITAS --- */}
            {currentTab === "receita" && (
              <table className="w-full text-sm text-left">
                <thead className="text-[#8A8D82] text-xs font-semibold border-b border-[#F1F0EA]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nome</th>
                    <th className="px-6 py-4 font-medium">Categoria</th>
                    <th className="px-6 py-4 font-medium text-right">Valor</th>
                    <th className="px-6 py-4 font-medium text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F0EA]">
                  {incomes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-[#8A8D82]">Nenhuma receita lançada.</td>
                    </tr>
                  )}
                  {incomes.map((income: any) => (
                    <tr key={income.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#1B2430]">
                        <div className="flex items-center gap-2 flex-wrap">
                          {income.name}
                          {income.isRecurring && <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">↻ Recorrente</span>}
                          <span className="text-[10px] font-medium bg-[#F1F0EA] text-[#6B7280] px-1.5 py-0.5 rounded-full border border-[#E8E6DD]" title={income.user?.email || ''}>
                            {(income.user?.name || '—').split(' ')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1 w-max">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> {income.category || "Geral"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#1F6F5C] text-right">{fmt(income.value)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <IncomeModal income={income} />
                          <form action={async () => { "use server"; await deleteIncome(income.id); }}>
                            <button type="submit" className="text-[#8A8D82] hover:text-[#B23B3B] transition-colors p-1" title="Excluir">
                              <Trash2 size={16} />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* --- TABELA DE DESPESAS FIXAS --- */}
            {currentTab === "fixa" && (
              <>
                <div className="px-5 py-2 bg-blue-50/60 border-b border-blue-100 text-[11px] text-blue-800 flex items-center gap-1.5">
                  <Calendar size={12} /> Fixas são trazidas automaticamente para <span className="font-semibold capitalize">{monthLabel}</span> — variáveis só precisam preencher.
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="text-[#8A8D82] text-xs font-semibold border-b border-[#F1F0EA]">
                    <tr>
                      <th className="px-6 py-4 font-medium w-12">Pago</th>
                      <th className="px-6 py-4 font-medium">Venc.</th>
                      <th className="px-6 py-4 font-medium">Nome</th>
                      <th className="px-6 py-4 font-medium">Categoria</th>
                      <th className="px-6 py-4 font-medium text-right">Valor</th>
                      <th className="px-6 py-4 font-medium text-center w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F0EA]">
                    {fixedExpenses.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-[#8A8D82]">Nenhuma despesa fixa lançada. Elas aparecem todo mês automaticamente.</td></tr>
                    )}
                  {fixedExpenses.map((expense: any) => {
                    const isLinked = !!expense.linkedDebtId;
                    return (
                      <tr key={expense.id} className={`hover:bg-gray-50 transition-colors ${expense.paid ? 'opacity-60' : ''} ${isLinked ? 'bg-blue-50/40' : ''}`}>
                        <td className={`${isLinked ? 'px-6 py-2.5' : 'px-6 py-4'} text-center`}>
                          <form action={async () => { "use server"; await toggleFixedExpense(expense.id, expense.paid); }}>
                            <button type="submit" className={`p-1 ${expense.paid ? 'text-[#1F6F5C]' : 'text-[#8A8D82]'}`}>
                              {expense.paid ? <CheckCircle2 size={isLinked ? 16 : 18} /> : <Circle size={isLinked ? 16 : 18} />}
                            </button>
                          </form>
                        </td>
                        <td className={`${isLinked ? 'px-6 py-2.5' : 'px-6 py-4'} text-[#8A8D82] text-xs`}>Dia {expense.dueDay}</td>
                        <td className={`${isLinked ? 'px-6 py-2.5' : 'px-6 py-4'} font-semibold text-[#1B2430] ${expense.paid ? 'line-through' : ''} ${isLinked ? 'text-xs' : 'text-sm'}`}>
                          <div className="flex items-center gap-1.5">
                            {isLinked && <Link2 size={12} className="text-blue-500 flex-shrink-0" />}
                            <span className="truncate max-w-[140px]">{expense.name}</span>
                            {isLinked && expense.linkedDebt && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full truncate max-w-[80px]">{expense.linkedDebt.name}</span>}
                            <span className="text-[10px] font-medium bg-[#F1F0EA] text-[#6B7280] px-1 py-0.5 rounded-full border border-[#E8E6DD] hidden sm:inline">{(expense.user?.name || '—').split(' ')[0]}</span>
                          </div>
                        </td>
                        <td className={`${isLinked ? 'px-6 py-2.5' : 'px-6 py-4'}`}>
                          <span className={`text-xs px-2 py-0.5 rounded-md border ${isLinked ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {isLinked ? 'Vínculo' : expense.category}
                          </span>
                        </td>
                        <td className={`${isLinked ? 'px-6 py-2.5' : 'px-6 py-4'} font-bold text-[#B23B3B] text-right ${isLinked ? 'text-xs' : 'text-sm'}`}>{fmt(expense.value)}</td>
                        <td className={`${isLinked ? 'px-6 py-2.5' : 'px-6 py-4'} text-center`}>
                          <div className="flex items-center justify-center gap-0.5">
                            <FixedExpenseModal expense={expense} />
                            <form action={async () => { "use server"; await deleteFixedExpense(expense.id); }}>
                              <button type="submit" className="text-[#8A8D82] hover:text-[#B23B3B] transition-colors p-0.5" title="Excluir">
                                <Trash2 size={14} />
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </>
            )}

            {/* --- TABELA DE DESPESAS VARIÁVEIS --- */}
            {currentTab === "variavel" && (
              <table className="w-full text-sm text-left">
                <thead className="text-[#8A8D82] text-xs font-semibold border-b border-[#F1F0EA]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Data</th>
                    <th className="px-6 py-4 font-medium">Nome</th>
                    <th className="px-6 py-4 font-medium">Categoria</th>
                    <th className="px-6 py-4 font-medium text-right">Valor</th>
                    <th className="px-6 py-4 font-medium text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F0EA]">
                  {variableExpenses.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-[#8A8D82]">Nenhum gasto variável lançado.</td></tr>
                  )}
                  {variableExpenses.map((expense: any) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-[#8A8D82]">
                        <span className="flex items-center gap-1.5"><Clock size={12}/> {new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#1B2430]">
                        <div className="flex items-center gap-2">
                          {expense.name}
                          <span className="text-[10px] font-medium bg-[#F1F0EA] text-[#6B7280] px-1.5 py-0.5 rounded-full border border-[#E8E6DD]">{(expense.user?.name || '—').split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#B23B3B] text-right">{fmt(expense.value)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <VariableExpenseModal expense={expense} />
                          <form action={async () => { "use server"; await deleteVariableExpense(expense.id); }}>
                            <button type="submit" className="text-[#8A8D82] hover:text-[#B23B3B] transition-colors p-1" title="Excluir">
                              <Trash2 size={16} />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
          </div>
        </Card>

        {/* Gráfico Dinâmico (Ocupa 1 coluna) */}
        <Card className="bg-white border-none shadow-sm rounded-2xl col-span-1 flex flex-col p-6 min-h-[300px]">
           <BudgetChart 
             data={
               currentTab === "receita" ? incomes :
               currentTab === "fixa" ? fixedExpenses : 
               variableExpenses
             } 
             type={currentTab} 
           />
        </Card>

      </div>
    </div>
  );
}