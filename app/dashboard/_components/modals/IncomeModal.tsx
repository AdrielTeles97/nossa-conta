"use client";

import { useState, useEffect } from "react";
import { addIncome, updateIncome } from "@/app/actions/budget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { CategorySelect } from "@/components/ui/category-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";

type IncomeData = {
  id: string;
  name: string;
  value: any;
  category?: string;
  createdAt?: string | Date;
  isRecurring?: boolean;
  payDay?: number | null;
};

type FixedOpt = { id: string; name: string; value: any; dueDay: number; allocated?: boolean };
type VarOpt = { id: string; name: string; value: any; category: string; allocated?: boolean };

export function IncomeModal({ income }: { income?: IncomeData }) {
  const isEdit = !!income;
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [value, setValue] = useState("");
  const [category, setCategory] = useState(income?.category || "Geral");
  const [isRecurring, setIsRecurring] = useState(income?.isRecurring || false);
  const [payDay, setPayDay] = useState<string>(String(income?.payDay || ""));
  const [fixedOpts, setFixedOpts] = useState<FixedOpt[]>([]);
  const [varOpts, setVarOpts] = useState<VarOpt[]>([]);
  const [alloc, setAlloc] = useState<Record<string, string>>({});

  const fmtCurrency = (v: any) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmt = fmtCurrency;
  const parseBRL = (s: string) => {
    const c = s.replace(/\s/g, "").replace("R$", "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(c);
    return isNaN(n) ? 0 : n;
  };

  // período atual para travar alocações duplicadas no mesmo mês
  const currentPeriod = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (open) {
      // busca fixas e variáveis para vincular, já marcando se está alocado em outro salário no mesmo período
      const periodParam = currentPeriod ? `?period=${currentPeriod}${isEdit && income ? `&excludeIncomeId=${income.id}` : ""}` : "";
      fetch(`/api/fixed-for-alloc${periodParam}`).then((r) => r.json()).then((d) => {
        if (Array.isArray(d)) {
          setFixedOpts(d || []);
          setVarOpts([]);
        } else {
          setFixedOpts(d.fixed || []);
          setVarOpts(d.variable || []);
        }
      }).catch(() => { setFixedOpts([]); setVarOpts([]); });
      if (isEdit && income) {
        setDate(income.createdAt ? new Date(income.createdAt) : new Date());
        setValue(fmtCurrency(income.value));
        setCategory(income.category || "Geral");
        setIsRecurring(!!income.isRecurring);
        setPayDay(income.payDay ? String(income.payDay) : "");
        // carrega alocações existentes (fixas e variáveis) - filtra por período atual
        fetch(`/api/alloc?incomeId=${income.id}`).then((r) => r.json()).then((d) => {
          const m: Record<string, string> = {};
          (d || []).forEach((a: any) => {
            // só carrega se for do período atual (ou sem período = global)
            if (a.period && a.period !== currentPeriod) return;
            if (a.fixedExpenseId) m[`fixed_${a.fixedExpenseId}`] = fmtCurrency(a.amount);
            if (a.variableExpenseId) m[`var_${a.variableExpenseId}`] = fmtCurrency(a.amount);
          });
          setAlloc(m);
        }).catch(() => {});
      } else {
        setDate(new Date());
        setValue("");
        setCategory("Geral");
        setIsRecurring(false);
        setPayDay("");
        setAlloc({});
      }
    }
  }, [open, isEdit, income, currentPeriod]);

  const totalAlocado = Object.values(alloc).reduce((a, v) => a + parseBRL(v), 0);
  const sobra = parseBRL(value) - totalAlocado;

  async function clientAction(formData: FormData) {
    // adiciona alocações ao formData (chaves já com prefixo fixed_/var_) + período para travar por mês
    Object.entries(alloc).forEach(([key, val]) => {
      if (parseBRL(val) > 0) formData.set(`alloc_${key}`, val);
    });
    formData.set("allocPeriod", currentPeriod);
    if (isEdit) await updateIncome(formData);
    else await addIncome(formData);
    setOpen(false);
  }

  return (
    <>
      {isEdit ? (
        <button onClick={() => setOpen(true)} className="text-[#8A8D82] hover:text-[#1B2430] p-1" title="Editar">
          <Pencil size={16} />
        </button>
      ) : (
        <Button variant="outline" className="flex items-center gap-2 text-sm font-semibold h-9" onClick={() => setOpen(true)}>
          <Plus size={16} /> Adicionar
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] bg-[#FBFAF6] border-[#D9D6C9] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#1B2430]">{isEdit ? "Editar Receita" : "Nova Receita"}</DialogTitle>
            <p className="text-sm text-[#8A8D82]">Defina quando recebe e o que paga com este salário.</p>
          </DialogHeader>

          <form action={clientAction} className="space-y-4 mt-2">
            {isEdit && <input type="hidden" name="id" value={income!.id} />}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[#4A5160] font-semibold">Data</Label>
                <DatePicker value={date} onChange={setDate} name="date" placeholder="Selecione a data" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#4A5160] font-semibold">Dia que recebe</Label>
                <Input name="payDay" type="number" min={1} max={31} placeholder="ex: 10, 30, 01" value={payDay} onChange={(e) => setPayDay(e.target.value)} className="bg-white" />
                <p className="text-[10px] text-[#8A8D82]">Para organizar por quinzena</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value" className="text-[#4A5160] font-semibold">Valor</Label>
              <CurrencyInput id="value" name="value" required className="bg-white" value={value} onValueChange={(m) => setValue(m)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#4A5160] font-semibold">Descrição</Label>
              <Input id="name" name="name" defaultValue={income?.name} placeholder="Ex: Salário - dia 30" required className="bg-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-[#4A5160] font-semibold">Categoria</Label>
              <CategorySelect type="income" name="category" value={category} onChange={setCategory} required />
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-lg border bg-white border-[#E8E6DD] cursor-pointer">
              <input type="checkbox" name="isRecurring" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1F6F5C]" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-[#1B2430]">Tornar recorrente</div>
                <div className="text-xs text-[#8A8D82]">Repete todo mês automaticamente.</div>
              </div>
            </label>

            <div className="border rounded-xl bg-white p-3 space-y-3">
              <div className="flex justify-between items-center">
                <Label className="font-semibold">O que paga com este salário?</Label>
                <span className={`text-xs font-mono px-2 py-1 rounded-full ${sobra >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>Sobra {fmt(sobra)}</span>
              </div>
              <p className="text-[11px] text-[#8A8D82]">Marque fixas e variáveis que saem deste recebimento. Valor vem preenchido, pode ajustar (ex: moto, gasolina, pessoal).</p>
              <div>
                <div className="text-[11px] font-bold text-[#1F6F5C] mb-1">Despesas fixas</div>
                <div className="max-h-[140px] overflow-auto divide-y border rounded-lg">
                  {fixedOpts.length === 0 && <p className="text-xs text-[#8A8D82] p-3">Nenhuma fixa. Crie em Gastos Mensais.</p>}
                  {fixedOpts.map((f) => {
                    const isAllocated = (f as any).allocated && alloc[`fixed_${f.id}`] === undefined;
                    return (
                      <label key={`fixed_${f.id}`} className={`flex items-center gap-2 p-2 hover:bg-[#F9F9F7] ${isAllocated ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          checked={alloc[`fixed_${f.id}`] !== undefined}
                          disabled={isAllocated}
                          onChange={(e) => {
                            if (e.target.checked) setAlloc((prev) => ({ ...prev, [`fixed_${f.id}`]: fmt(f.value) }));
                            else setAlloc((prev) => { const n = { ...prev }; delete n[`fixed_${f.id}`]; return n; });
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-[#1F6F5C] disabled:opacity-50"
                        />
                        <span className="flex-1 text-xs font-medium">{f.name} <span className="text-[#8A8D82]">• Dia {f.dueDay}</span> {isAllocated && <span className="text-[10px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full">já vinculado em {currentPeriod}</span>}</span>
                        <CurrencyInput
                          value={alloc[`fixed_${f.id}`] || ""}
                          onValueChange={(v) => setAlloc((prev) => ({ ...prev, [`fixed_${f.id}`]: v }))}
                          placeholder={fmt(f.value)}
                          className="h-8 w-28 bg-white text-xs"
                          disabled={alloc[`fixed_${f.id}`] === undefined}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#B23B3B] mb-1">Despesas variáveis</div>
                <div className="max-h-[120px] overflow-auto divide-y border rounded-lg">
                  {varOpts.length === 0 && <p className="text-xs text-[#8A8D82] p-3">Nenhuma variável recente. Crie em Gastos Mensais.</p>}
                  {varOpts.map((v) => {
                    const isAllocated = (v as any).allocated && alloc[`var_${v.id}`] === undefined;
                    return (
                      <label key={`var_${v.id}`} className={`flex items-center gap-2 p-2 hover:bg-[#F9F9F7] ${isAllocated ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          checked={alloc[`var_${v.id}`] !== undefined}
                          disabled={isAllocated}
                          onChange={(e) => {
                            if (e.target.checked) setAlloc((prev) => ({ ...prev, [`var_${v.id}`]: fmt(v.value) }));
                            else setAlloc((prev) => { const n = { ...prev }; delete n[`var_${v.id}`]; return n; });
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-[#B23B3B] disabled:opacity-50"
                        />
                        <span className="flex-1 text-xs font-medium">{v.name} <span className="text-[#8A8D82]">• {v.category}</span> {isAllocated && <span className="text-[10px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full">já vinculado</span>}</span>
                        <CurrencyInput
                          value={alloc[`var_${v.id}`] || ""}
                          onValueChange={(vv) => setAlloc((prev) => ({ ...prev, [`var_${v.id}`]: vv }))}
                          placeholder={fmt(v.value)}
                          className="h-8 w-28 bg-white text-xs"
                          disabled={alloc[`var_${v.id}`] === undefined}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="text-[11px] text-[#8A8D82]">Total alocado: <b>{fmt(totalAlocado)}</b> • Sobra: <b className={sobra >= 0 ? "text-green-700" : "text-red-600"}>{fmt(sobra)}</b></div>
            </div>

            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1F6F5C] hover:bg-[#154E41]">
                {isEdit ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
