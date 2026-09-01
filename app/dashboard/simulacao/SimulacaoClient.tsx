"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

function parseBRL(s: string) {
  if (!s) return 0;
  const c = s.replace(/\s/g, "").replace("R$", "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(c);
  return isNaN(n) ? 0 : n;
}
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Entry = {
  id: string;
  nome: string;
  total: string;
  mes: string;
  parcelas: string;
  pagas: string;
  taxa: string;
  forma: "dinheiro" | "cartao";
  categoria: "material" | "ferragem" | "mao" | "pontual";
};

export default function SimulacaoClient({ defaults }: { defaults: { rendaFixa: number; despesasFixas: number; caixa: number } | null }) {
  const [tab, setTab] = useState<"premissa" | "fluxo">("fluxo");
  const [salario1, setSalario1] = useState("R$ 5.600,00");
  const [salario2, setSalario2] = useState("R$ 4.600,00");
  const [bonusSet, setBonusSet] = useState("R$ 2.200,00");
  const [bonusDez, setBonusDez] = useState("R$ 10.200,00");
  const [caixa0, setCaixa0] = useState("R$ 1.500,00");
  const [fixas, setFixas] = useState("R$ 4.984,90");
  const [horizonte, setHorizonte] = useState("7");
  const [entries, setEntries] = useState<Entry[]>([
    { id: "1", nome: "Quitação Nubank (2x)", total: "R$ 3.270,78", mes: "2026-09", parcelas: "1", pagas: "0", taxa: "0", forma: "dinheiro", categoria: "pontual" },
    { id: "2", nome: "Manutenção ar", total: "R$ 300,00", mes: "2026-09", parcelas: "1", pagas: "0", taxa: "0", forma: "dinheiro", categoria: "pontual" },
    { id: "3", nome: "Projeto energético", total: "R$ 400,00", mes: "2026-09", parcelas: "1", pagas: "0", taxa: "0", forma: "dinheiro", categoria: "pontual" },
    { id: "4", nome: "Ferragem baldrame", total: "R$ 3.500,00", mes: "2026-09", parcelas: "2", pagas: "0", taxa: "0", forma: "dinheiro", categoria: "ferragem" },
    { id: "5", nome: "Cimento 30 sacas", total: "R$ 1.650,00", mes: "2026-10", parcelas: "6", pagas: "0", taxa: "0", forma: "cartao", categoria: "material" },
    { id: "6", nome: "Tábua 10 dz", total: "R$ 1.200,00", mes: "2026-10", parcelas: "6", pagas: "0", taxa: "0", forma: "cartao", categoria: "material" },
    { id: "7", nome: "Ripão 7 dz", total: "R$ 490,00", mes: "2026-10", parcelas: "6", pagas: "0", taxa: "0", forma: "cartao", categoria: "material" },
    { id: "8", nome: "Mão de obra pedreiro", total: "R$ 3.500,00", mes: "2026-10", parcelas: "1", pagas: "0", taxa: "0", forma: "dinheiro", categoria: "mao" },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Entry | null>(null);
  const [newNome, setNewNome] = useState("");
  const [newTotal, setNewTotal] = useState("");
  const [newMes, setNewMes] = useState("2026-10");
  const [newParcelas, setNewParcelas] = useState("1");
  const [newPagas, setNewPagas] = useState("0");
  const [newTaxa, setNewTaxa] = useState("0");
  const [newForma, setNewForma] = useState<"dinheiro" | "cartao">("dinheiro");
  const [newCat, setNewCat] = useState<Entry["categoria"]>("material");

  const rendaFixa = parseBRL(salario1) + parseBRL(salario2);
  const meses = useMemo(() => {
    const h = parseInt(horizonte) || 7;
    const start = new Date(2026, 8, 1);
    return Array.from({ length: h }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const k = `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
      return { k, label, date: d };
    });
  }, [horizonte]);

  const fluxo = useMemo(() => {
    let saldo = parseBRL(caixa0);
    const fixasVal = parseBRL(fixas);
    return meses.map((m) => {
      const saldoInicial = saldo;
      let bonus = 0;
      if (m.k === "2026-09") bonus = parseBRL(bonusSet);
      if (m.k === "2026-12") bonus = parseBRL(bonusDez);
      const renda = rendaFixa + bonus;
      const totalDisp = renda + saldoInicial;
      let obraNoMes = 0;
      entries.forEach((e) => {
        const total = parseBRL(e.total);
        const parc = parseInt(e.parcelas) || 1;
        const pagas = parseInt(e.pagas) || 0;
        const taxa = parseFloat(e.taxa.replace(",", ".")) || 0;
        const comJuros = total * (1 + taxa / 100);
        const parcela = comJuros / parc;
        const startIdx = meses.findIndex((mm) => mm.k === e.mes);
        const curIdx = meses.findIndex((mm) => mm.k === m.k);
        if (startIdx === -1 || curIdx === -1) return;
        if (curIdx < startIdx) return;
        if (curIdx >= startIdx + parc) return;
        const idxInParc = curIdx - startIdx;
        if (idxInParc < pagas) return;
        obraNoMes += parcela;
      });
      const totalDespesas = fixasVal + obraNoMes;
      const saldoFinal = totalDisp - totalDespesas;
      saldo = saldoFinal;
      return { ...m, saldoInicial, renda, bonus, totalDisp, totalDespesas, obraNoMes, saldoFinal, fixas: fixasVal };
    });
  }, [caixa0, rendaFixa, fixas, bonusSet, bonusDez, entries, meses]);

  function addEntry() {
    if (!newNome || !newTotal) return;
    setEntries((prev) => [...prev, { id: Date.now().toString(), nome: newNome, total: newTotal, mes: newMes, parcelas: newParcelas, pagas: newPagas, taxa: newTaxa, forma: newForma, categoria: newCat }]);
    setNewNome(""); setNewTotal(""); setNewPagas("0"); setNewTaxa("0");
  }
  function startEdit(e: Entry) {
    setEditingId(e.id);
    setEditData({ ...e });
  }
  function saveEdit() {
    if (!editData) return;
    setEntries((prev) => prev.map((x) => x.id === editData.id ? editData : x));
    setEditingId(null);
    setEditData(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button variant={tab === "premissa" ? "default" : "outline"} size="sm" onClick={() => setTab("premissa")} className={tab === "premissa" ? "bg-[#1F6F5C]" : ""}>Premissas</Button>
        <Button variant={tab === "fluxo" ? "default" : "outline"} size="sm" onClick={() => setTab("fluxo")} className={tab === "fluxo" ? "bg-[#1F6F5C]" : ""}>Fluxo de Caixa</Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#8A8D82]">Horizonte</span>
          <select value={horizonte} onChange={(e) => setHorizonte(e.target.value)} className="h-8 rounded-md border bg-white px-2 text-xs">
            <option value="6">6 meses</option>
            <option value="7">7 meses (Set-Mar)</option>
            <option value="12">12 meses</option>
            <option value="18">18 meses</option>
            <option value="24">24 meses</option>
          </select>
        </div>
      </div>

      {tab === "premissa" && (
        <div className="space-y-4">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-3 text-xs text-amber-800">Fixas mensais puxadas de <b>Gastos Mensais</b> ({fmt(parseBRL(fixas))}) — edite lá que reflete aqui. | Caixa inicial = saldo anterior editável. • <b>Agora editável abaixo</b></CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-white border-none shadow-sm rounded-2xl">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-xs tracking-widest uppercase">Renda & Caixa</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Salário 1</Label><CurrencyInput value={salario1} onValueChange={setSalario1} className="bg-white h-9" /></div>
                  <div><Label className="text-xs">Salário 2</Label><CurrencyInput value={salario2} onValueChange={setSalario2} className="bg-white h-9" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Bônus Set (férias)</Label><CurrencyInput value={bonusSet} onValueChange={setBonusSet} className="bg-white h-9" /></div>
                  <div><Label className="text-xs">13º Dez</Label><CurrencyInput value={bonusDez} onValueChange={setBonusDez} className="bg-white h-9" /></div>
                </div>
                <div><Label className="text-xs">Caixa em mãos (início Set)</Label><CurrencyInput value={caixa0} onValueChange={setCaixa0} className="bg-white h-9" /></div>
                <div><Label className="text-xs">Despesas fixas mensais</Label><CurrencyInput value={fixas} onValueChange={setFixas} className="bg-white h-9" /></div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm rounded-2xl">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-xs tracking-widest uppercase">Adicionar lançamento</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">O que é</Label><Input value={newNome} onChange={(e) => setNewNome(e.target.value)} placeholder="Ex: Cimento 30 sacas" className="bg-white h-8" /></div>
                  <div><Label className="text-xs">Categoria</Label><select value={newCat} onChange={(e) => setNewCat(e.target.value as any)} className="h-8 w-full rounded-md border bg-white px-2 text-xs"><option value="material">Material</option><option value="ferragem">Ferragem</option><option value="mao">Mão de obra</option><option value="pontual">Pontual</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Valor total</Label><CurrencyInput value={newTotal} onValueChange={setNewTotal} className="bg-white h-8" /></div>
                  <div><Label className="text-xs">Mês competência</Label><MonthYearPicker value={newMes} onChange={setNewMes} /></div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div><Label className="text-xs">Parcelas</Label><Input value={newParcelas} onChange={(e) => setNewParcelas(e.target.value)} className="bg-white h-8" /></div>
                  <div><Label className="text-xs">Já pagas</Label><Input value={newPagas} onChange={(e) => setNewPagas(e.target.value)} className="bg-white h-8" /></div>
                  <div><Label className="text-xs">Taxa %</Label><Input value={newTaxa} onChange={(e) => setNewTaxa(e.target.value)} placeholder="0" className="bg-white h-8" /></div>
                  <div><Label className="text-xs">Forma</Label><select value={newForma} onChange={(e) => setNewForma(e.target.value as any)} className="h-8 w-full rounded-md border bg-white px-2 text-xs"><option value="dinheiro">Dinheiro</option><option value="cartao">Cartão</option></select></div>
                </div>
                <Button onClick={addEntry} className="w-full bg-[#1F6F5C] gap-1"><Plus size={14} /> Adicionar</Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-none shadow-sm rounded-2xl">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs tracking-widest uppercase">Lançamentos ({entries.length}) — clique no lápis para editar</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[420px] overflow-auto">
                {entries.map((e) => (
                  <div key={e.id} className="p-3 text-xs">
                    {editingId === e.id && editData ? (
                      <div className="space-y-2 bg-[#FBFAF6] p-3 rounded-lg border">
                        <Input value={editData.nome} onChange={(ev) => setEditData({ ...editData, nome: ev.target.value })} className="bg-white h-8" placeholder="Nome" />
                        <div className="grid grid-cols-2 gap-2">
                          <CurrencyInput value={editData.total} onValueChange={(v) => setEditData({ ...editData, total: v })} className="bg-white h-8" />
                          <MonthYearPicker value={editData.mes} onChange={(v) => setEditData({ ...editData, mes: v })} />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <Input value={editData.parcelas} onChange={(ev) => setEditData({ ...editData, parcelas: ev.target.value })} className="bg-white h-8" placeholder="Parc" />
                          <Input value={editData.pagas} onChange={(ev) => setEditData({ ...editData, pagas: ev.target.value })} className="bg-white h-8" />
                          <Input value={editData.taxa} onChange={(ev) => setEditData({ ...editData, taxa: ev.target.value })} className="bg-white h-8" />
                          <select value={editData.forma} onChange={(ev) => setEditData({ ...editData, forma: ev.target.value as any })} className="h-8 rounded-md border bg-white px-2"><option value="dinheiro">Dinheiro</option><option value="cartao">Cartão</option></select>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-[#1F6F5C] gap-1" onClick={saveEdit}><Check size={12} /> Salvar</Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditData(null); }}><X size={12} /> Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between gap-3">
                        <div>
                          <div className="font-semibold">{e.nome} <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full">{e.categoria}</span> <span className="text-[10px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded-full">{e.forma}</span></div>
                          <div className="text-[#8A8D82]">{e.mes} • {e.parcelas}x {e.pagas !== "0" ? `(${e.pagas} pagas)` : ""} {e.taxa !== "0" ? `• ${e.taxa}% taxa` : ""} • {e.total}</div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(e)} className="text-[#1F6F5C] p-1"><Pencil size={14} /></button>
                          <button onClick={() => setEntries((prev) => prev.filter((x) => x.id !== e.id))} className="text-[#B23B3B] p-1"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "fluxo" && (
        <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-sm">Fluxo — {meses[0].k} a {meses[meses.length -1].k}</h3>
            <span className="text-[11px] text-[#8A8D82]">Fixas de Gastos Mensais • caixa editável</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[720px]">
              <thead className="bg-[#1B2430] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Mês</th>
                  {fluxo.map((m) => <th key={m.k} className="px-3 py-2 text-right capitalize">{m.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="bg-[#F9F9F7]"><td className="px-3 py-2 font-semibold">Saldo inicial</td>{fluxo.map((m) => <td key={m.k} className="px-3 py-2 text-right font-mono">{fmt(m.saldoInicial)}</td>)}</tr>
                <tr><td className="px-3 py-2">+ Renda</td>{fluxo.map((m) => <td key={m.k} className="px-3 py-2 text-right text-green-700">{fmt(m.renda)}</td>)}</tr>
                <tr className="bg-[#E8F5E9] font-bold"><td className="px-3 py-2">Total disponível</td>{fluxo.map((m) => <td key={m.k} className="px-3 py-2 text-right">{fmt(m.totalDisp)}</td>)}</tr>
                <tr><td colSpan={fluxo.length +1} className="bg-[#1F6F5C] text-white px-3 py-1.5 font-bold text-[11px] tracking-widest uppercase">Despesas + Obra</td></tr>
                <tr><td className="px-3 py-2">- Fixas</td>{fluxo.map((m) => <td key={m.k} className="px-3 py-2 text-right text-red-600">({fmt(parseBRL(fixas))})</td>)}</tr>
                <tr><td className="px-3 py-2">- Obra/Pontuais</td>{fluxo.map((m) => <td key={m.k} className="px-3 py-2 text-right text-red-600">({fmt(m.obraNoMes)})</td>)}</tr>
                <tr className="bg-[#FFEBEE] font-bold text-red-700"><td className="px-3 py-2">Total despesas</td>{fluxo.map((m) => <td key={m.k} className="px-3 py-2 text-right">({fmt(m.totalDespesas)})</td>)}</tr>
                <tr className="bg-[#E0F2F1] font-bold"><td className="px-3 py-2">Saldo final</td>{fluxo.map((m) => <td key={m.k} className={`px-3 py-2 text-right ${m.saldoFinal < 0 ? "text-red-600" : "text-[#1F6F5C]"}`}>{fmt(m.saldoFinal)}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-amber-50 border-t text-[11px] text-amber-800">Em {fluxo[fluxo.length-1].k} saldo previsto <b>{fmt(fluxo[fluxo.length-1].saldoFinal)}</b> • Caixa inicial {fmt(parseBRL(caixa0))} • Obra total {fmt(entries.reduce((a,c)=>a+parseBRL(c.total),0))} parcelada.</div>
        </Card>
      )}
    </div>
  );
}
