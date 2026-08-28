"use client";

import { useState, useEffect } from "react";
import { addInvestment, updateInvestment } from "@/app/actions/investments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";

type Data = { id: string; name: string; invested: any; current: any };

export function InvestmentModal({ investment }: { investment?: Data }) {
  const isEdit = !!investment;
  const [open, setOpen] = useState(false);
  const [invested, setInvested] = useState("");
  const [current, setCurrent] = useState("");
  const [pct, setPct] = useState("");
  const fmt = (v: any) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const parseBRL = (s: string) => {
    if (!s) return 0;
    const c = s.replace(/\s/g, "").replace("R$", "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(c);
    return isNaN(n) ? 0 : n;
  };
  const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    if (open && isEdit && investment) {
      setInvested(fmt(investment.invested));
      setCurrent(fmt(investment.current));
      const inv = Number(investment.invested);
      const cur = Number(investment.current);
      const p = inv > 0 ? ((cur - inv) / inv) * 100 : 0;
      setPct(p ? p.toFixed(2).replace(".", ",") : "");
    } else if (open) {
      setInvested("");
      setCurrent("");
      setPct("");
    }
  }, [open, isEdit, investment]);

  function handleInvestedChange(masked: string) {
    setInvested(masked);
    const inv = parseBRL(masked);
    const p = parseFloat(pct.replace(",", ".")) || 0;
    if (inv > 0 && p) {
      const cur = inv * (1 + p / 100);
      setCurrent(fmtBRL(cur));
    }
  }
  function handleCurrentChange(masked: string) {
    setCurrent(masked);
    const inv = parseBRL(invested);
    const cur = parseBRL(masked);
    if (inv > 0) {
      const p = ((cur - inv) / inv) * 100;
      setPct(p.toFixed(2).replace(".", ","));
    } else {
      setPct("");
    }
  }
  function handlePctChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/[^0-9,\.-]/g, "").replace(".", ",");
    setPct(v);
    const inv = parseBRL(invested);
    const p = parseFloat(v.replace(",", ".")) || 0;
    if (inv > 0) {
      const cur = inv * (1 + p / 100);
      setCurrent(fmtBRL(cur));
    }
  }

  async function action(formData: FormData) {
    if (isEdit) await updateInvestment(formData);
    else await addInvestment(formData);
    setOpen(false);
  }

  return (
    <>
      {isEdit ? (
        <button onClick={() => setOpen(true)} className="text-[#8A8D82] hover:text-[#1B2430] p-1" title="Editar">
          <Pencil size={14} />
        </button>
      ) : (
        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setOpen(true)}>
          <Plus size={12} /> Adicionar
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px] bg-[#FBFAF6] border-[#D9D6C9]">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar Investimento" : "Novo Investimento"}</DialogTitle>
            <p className="text-xs text-[#8A8D82]">Valor investido e valor atual.</p>
          </DialogHeader>
          <form action={action} className="space-y-4">
            {isEdit && <input type="hidden" name="id" value={investment!.id} />}
            <div className="space-y-2">
              <Label>Nome do ativo</Label>
              <Input name="name" defaultValue={investment?.name} placeholder="Ex: Caixinha Nubank" required className="bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Investido</Label>
                <CurrencyInput name="invested" value={invested} onValueChange={handleInvestedChange} required className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label>Valor atual</Label>
                <CurrencyInput name="current" value={current} onValueChange={handleCurrentChange} required className="bg-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rendimento (%)</Label>
              <div className="relative">
                <Input value={pct} onChange={handlePctChange} placeholder="Ex: 2,5" className="bg-white pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8D82]">%</span>
              </div>
              <p className="text-[11px] text-[#8A8D82]">Preencha % para calcular o valor atual, ou preencha o valor atual para ver o %.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1F6F5C]">{isEdit ? "Salvar" : "Adicionar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
