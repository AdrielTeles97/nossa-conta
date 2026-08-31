import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateHouseholdForUser } from "@/lib/household";
import SimulacaoClient from "./SimulacaoClient";

export default async function SimulacaoPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  let defaults = null;
  if (userId) {
    const h = await getOrCreateHouseholdForUser(userId);
    const [incomes, fixed, cash] = await Promise.all([
      prisma.income.findMany({ where: { householdId: h.id } }),
      prisma.fixedExpense.findMany({ where: { householdId: h.id } }),
      prisma.cashBalance.findMany({ where: { householdId: h.id } }),
    ]);
    const rendaFixa = incomes.filter((i) => i.isRecurring).reduce((a, c) => a + Number(c.value), 0) || 10200;
    const despesasFixas = fixed.filter((f) => f.isRecurring || !f.period).reduce((a, c) => a + Number(c.value), 0) || 4984.90;
    const caixa = cash.reduce((a, c) => a + Number(c.amount), 0) || 1500;
    defaults = { rendaFixa, despesasFixas, caixa };
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B2430]">Simulação — Caixa e Obra</h2>
        <p className="text-xs text-[#8A8D82]">Projete obra, parcelas e fluxo de caixa de Set/26 a Mar/27. Edite premissas e veja o saldo final recalcular na hora.</p>
      </div>
      <SimulacaoClient defaults={defaults} />
    </div>
  );
}
