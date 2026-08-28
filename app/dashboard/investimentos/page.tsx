import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrCreateHouseholdForUser } from "@/lib/household";
import { Card, CardContent } from "@/components/ui/card";
import { InvestmentModal } from "@/app/dashboard/_components/modals/InvestmentModal";
import { deleteInvestment } from "@/app/actions/investments";
import { Trash2, TrendingUp, Wallet } from "lucide-react";

export default async function InvestimentosPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  let investments: any[] = [];
  let totalInvestido = 0;
  let valorAtual = 0;
  if (userId) {
    const h = await getOrCreateHouseholdForUser(userId);
    investments = await prisma.investment.findMany({ where: { householdId: h.id }, orderBy: { invested: "desc" }, include: { user: { select: { name: true } } } });
    totalInvestido = investments.reduce((a, c) => a + Number(c.invested), 0);
    valorAtual = investments.reduce((a, c) => a + Number(c.current), 0);
  }
  const rendimento = valorAtual - totalInvestido;
  const pct = totalInvestido > 0 ? (rendimento / totalInvestido) * 100 : 0;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[#8A8D82] font-medium">Olá, {session?.user?.name || "CB"}</p>
        <h2 className="text-2xl font-bold text-[#1B2430] tracking-tight">Investimentos</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#1B6B4A] to-[#0F3D2E] text-white border-none shadow-md rounded-2xl lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-[11px] tracking-widest uppercase opacity-80">Valor Atual</div>
            <div className="text-2xl font-bold mt-1">{fmt(valorAtual)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase text-[#8A8D82]"><Wallet size={14} /> Total Investido</div>
            <div className="text-xl font-bold text-[#1B2430] mt-1">{fmt(totalInvestido)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase text-[#8A8D82]"><TrendingUp size={14} /> Rendimento</div>
            <div className={`text-xl font-bold mt-1 ${rendimento >= 0 ? "text-[#1F6F5C]" : "text-[#B23B3B]"}`}>{rendimento >= 0 ? "+" : ""}{fmt(rendimento)}</div>
            <div className="text-xs text-[#8A8D82]">{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-none shadow-sm rounded-2xl">
          <div className="p-5 border-b border-[#F1F0EA] flex justify-between items-center">
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#1F6F5C]">Em Caixa</h3>
            <InvestmentModal />
          </div>
          <CardContent className="p-6 text-center text-sm text-[#8A8D82]">
            {investments.length === 0 ? "Nenhum item ainda." : `${investments.length} item(s) em ativos.`}
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[#F1F0EA] flex justify-between items-center">
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#1B2430]">Ativos</h3>
            <InvestmentModal />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] text-[#8A8D82] uppercase bg-[#F9F9F7]">
                <tr>
                  <th className="px-4 py-3 text-left">Ativo</th>
                  <th className="px-4 py-3 text-right">Investido</th>
                  <th className="px-4 py-3 text-right">Atual</th>
                  <th className="px-4 py-3 text-right">Rend.</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F0EA]">
                {investments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#8A8D82]">Nenhum investimento cadastrado.</td>
                  </tr>
                )}
                {investments.map((inv: any) => {
                  const rend = Number(inv.current) - Number(inv.invested);
                  const p = Number(inv.invested) > 0 ? (rend / Number(inv.invested)) * 100 : 0;
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#1B2430]">{inv.name}</div>
                        <div className="text-[11px] text-[#8A8D82]">{inv.user?.name || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{fmt(Number(inv.invested))}</td>
                      <td className="px-4 py-3 text-right font-bold">{fmt(Number(inv.current))}</td>
                      <td className="px-4 py-3 text-right">
                        <div className={`font-semibold ${rend >= 0 ? "text-[#1F6F5C]" : "text-[#B23B3B]"}`}>{fmt(rend)}</div>
                        <div className="text-[11px] text-[#8A8D82]">{p.toFixed(2)}%</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center">
                          <InvestmentModal investment={inv} />
                          <form action={async () => { "use server"; await deleteInvestment(inv.id); }}>
                            <button className="p-1 text-[#8A8D82] hover:text-[#B23B3B]"><Trash2 size={14} /></button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
