import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrCreateHouseholdForUser } from "@/lib/household";
import { Card, CardContent } from "@/components/ui/card";
import { AssetModal } from "@/app/dashboard/_components/modals/AssetModal";
import { DebtModal } from "@/app/dashboard/_components/modals/DebtModal";
import { deleteAsset, deleteDebt, payDebtInstallment } from "@/app/actions/patrimonio";
import { Trash2 } from "lucide-react";

export default async function PatrimonioPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  let assets: any[] = [];
  let debts: any[] = [];
  let investments: any[] = [];
  let cashTotal = 0;
  if (userId) {
    const h = await getOrCreateHouseholdForUser(userId);
    const [a, d, inv, cashRows] = await Promise.all([
      prisma.asset.findMany({ where: { householdId: h.id }, include: { debts: true, user: { select: { name: true } } } }),
      prisma.debt.findMany({ where: { householdId: h.id }, include: { asset: true, fixedExpenses: true, user: { select: { name: true } } } }),
      prisma.investment.findMany({ where: { householdId: h.id } }),
      prisma.cashBalance.findMany({ where: { householdId: h.id } }),
    ]);
    assets = a;
    debts = d;
    investments = inv;
    cashTotal = cashRows.reduce((acc: number, c: any) => acc + Number(c.amount), 0);
  }
  // Liquidez = caixa + ativos de liquidez (categoria Reserva/Caixa) — simplificado: usa cashTotal
  const liquidez = cashTotal;
  const totalBens = assets.reduce((a, c) => a + Number(c.value), 0);
  const totalInvest = investments.reduce((a, c) => a + Number(c.current), 0);
  const totalDividas = debts.reduce((a, c) => a + Number(c.balance), 0);
  const patrimonioTotal = totalBens + totalInvest + liquidez - totalDividas;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const totalPositivo = liquidez + totalBens + totalInvest || 1;
  const compData = [
    { name: "Caixinha", value: totalInvest, color: "#1F6F5C" },
    { name: "Liquidez", value: liquidez, color: "#3B82F6" },
    { name: "Bens", value: totalBens, color: "#F59E0B" },
  ].filter((d) => d.value > 0);
  const compTotal = compData.reduce((a, c) => a + c.value, 0) || totalPositivo;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[#8A8D82]">Olá, {session?.user?.name || "CB"}</p>
        <h2 className="text-2xl font-bold text-[#1B2430]">Patrimônio</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-[#1B6B4A] to-[#0F3D2E] text-white border-none rounded-2xl col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <div className="text-[10px] tracking-widest uppercase opacity-80">Patrimônio Total</div>
            <div className={`text-xl font-bold mt-1 ${patrimonioTotal < 0 ? 'text-red-200' : ''}`}>{patrimonioTotal < 0 ? `- ${fmt(Math.abs(patrimonioTotal))}` : fmt(patrimonioTotal)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl border-none shadow-sm"><CardContent className="p-5"><div className="text-[10px] uppercase tracking-widest text-[#8A8D82] flex items-center gap-1.5">⧉ Liquidez</div><div className="font-bold text-[#1F6F5C]">{fmt(liquidez)}</div></CardContent></Card>
        <Card className="bg-white rounded-2xl border-none shadow-sm"><CardContent className="p-5"><div className="text-[10px] uppercase tracking-widest text-[#8A8D82] flex items-center gap-1.5">▦ Bens</div><div className="font-bold text-blue-600">{fmt(totalBens)}</div></CardContent></Card>
        <Card className="bg-white rounded-2xl border-none shadow-sm"><CardContent className="p-5"><div className="text-[10px] uppercase tracking-widest text-[#8A8D82] flex items-center gap-1.5">↗ Investimentos</div><div className="font-bold text-[#1F6F5C]">{fmt(totalInvest)}</div></CardContent></Card>
        <Card className="bg-white rounded-2xl border-none shadow-sm"><CardContent className="p-5"><div className="text-[10px] uppercase tracking-widest text-red-600">Dívidas</div><div className="font-bold text-[#B23B3B]">{fmt(totalDividas)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white rounded-2xl border-none shadow-sm lg:col-span-1">
          <div className="p-5 border-b">
            <h3 className="font-bold text-[#1B2430] text-sm">Composição do patrimônio</h3>
          </div>
          <div className="p-5">
            {compData.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-36 h-36 rounded-full border-[14px] border-[#E5E7EB] mx-auto flex items-center justify-center">
                  <span className="text-xs text-[#8A8D82]">vazio</span>
                </div>
                <p className="text-xs text-[#8A8D82] mt-4">Nenhum bem ou investimento yet.</p>
              </div>
            ) : (
              <>
                <div className="relative w-40 h-40 mx-auto">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {(() => {
                      let acc = 0;
                      return compData.map((d, i) => {
                        const pct = d.value / compTotal;
                        const dash = pct * 251.2;
                        const gap = 2;
                        const el = (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={d.color}
                            strokeWidth="14"
                            strokeDasharray={`${Math.max(0, dash - gap)} 251.2`}
                            strokeDashoffset={-acc}
                            strokeLinecap="round"
                            className="transition-all"
                          />
                        );
                        acc += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-[#1B2430]">100%</span>
                    <span className="text-[11px] text-[#8A8D82]">do total</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {compData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} /> {d.name}</span>
                      <span className="font-semibold">{fmt(d.value)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between text-xs font-bold">
                    <span>Total</span>
                    <span>{fmt(compTotal)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white rounded-2xl border-none shadow-sm">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest uppercase text-[#1F6F5C]">Liquidez</h3>
              <AssetModal />
            </div>
            <div className="p-4">
              {liquidez === 0 ? (
                <p className="text-xs text-[#8A8D82] text-center py-6">Nenhum item ainda.</p>
              ) : (
                <div className="text-sm">
                  <div className="flex justify-between font-semibold"><span>Caixa</span><span>{fmt(liquidez)}</span></div>
                  <p className="text-[11px] text-[#8A8D82] mt-1">Soma do saldo em caixa do mês.</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-white rounded-2xl border-none shadow-sm">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest uppercase text-blue-600">Bens</h3>
              <AssetModal />
            </div>
            <div className="p-4 max-h-[220px] overflow-auto space-y-2">
              {assets.length === 0 ? (
                <p className="text-xs text-[#8A8D82] text-center py-6">Nenhum item ainda.</p>
              ) : (
                assets.map((a: any) => {
                  const debt = debts.find((d) => d.assetId === a.id);
                  const total = debt ? (debt.totalInstallments || Math.ceil(Number(debt.balance) / Number(debt.installment || 1)) + Number(debt.paidInstallments || 0)) : 0;
                  const paid = debt?.paidInstallments ?? 0;
                  const installment = debt ? Number(debt.installment) : 0;
                  const originalFinanced = debt ? total * installment || Number(debt.balance) + paid * installment : 0;
                  const entrada = Number(a.value) - originalFinanced;
                  return (
                    <div key={a.id} className="border rounded-lg p-3 flex justify-between gap-2 text-xs">
                      <div>
                        <div className="font-semibold">{a.name}</div>
                        <div className="text-[#8A8D82]">{fmt(Number(a.value))} {debt ? `• faltam ${fmt(Number(debt.balance))} • ${paid}/${total}` : '• à vista'}</div>
                      </div>
                      <div className="flex gap-1">
                        <AssetModal asset={a} />
                        <form action={async () => { "use server"; await deleteAsset(a.id); }}><button className="p-1 text-[#B23B3B]"><Trash2 size={12} /></button></form>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="bg-white rounded-2xl border-none shadow-sm md:col-span-2">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest uppercase text-red-600">Dívidas</h3>
              <DebtModal />
            </div>
            <div className="p-4 space-y-2 max-h-[260px] overflow-auto">
              {debts.length === 0 && <p className="text-xs text-[#8A8D82] text-center py-6">Nenhuma dívida.</p>}
              {debts.map((d: any) => {
                const total = d.totalInstallments || Math.ceil(Number(d.balance) / Number(d.installment || 1)) + Number(d.paidInstallments || 0);
                const paid = d.paidInstallments ?? 0;
                const due = d.dueDay || d.fixedExpenses[0]?.dueDay || 10;
                return (
                  <div key={d.id} className="border rounded-lg p-3 flex justify-between gap-3">
                    <div>
                      <div className="font-semibold text-xs">{d.name} {d.asset && <span className="text-[10px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded-full">{d.asset.name}</span>}</div>
                      <div className="text-[11px] text-[#8A8D82]">{fmt(Number(d.balance))} • {fmt(Number(d.installment))}/mês • {paid}/{total} • dia {due}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <DebtModal debt={d} />
                      <form action={async () => { "use server"; await payDebtInstallment(d.id); }}><button className="text-[11px] bg-[#1F6F5C] text-white px-2 py-1 rounded-md">Pagar</button></form>
                      <form action={async () => { "use server"; await deleteDebt(d.id); }}><button className="text-[11px] text-[#B23B3B] px-1">Excluir</button></form>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
