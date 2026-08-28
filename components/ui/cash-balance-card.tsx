"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { setCashBalance } from "@/app/actions/cash";
import { Pencil, Wallet } from "lucide-react";

export function CashBalanceCard({ period, amount, monthLabel }: { period: string; amount: number; monthLabel: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  // parse handled by CurrencyInput, we just need to format initial
  useEffect(() => {
    if (open) setValue(amount ? fmt(amount) : "");
  }, [open, amount]);

  async function handleSave(fd: FormData) {
    await setCashBalance(fd);
    setOpen(false);
  }

  return (
    <>
      <div className="bg-white border border-[#D9D6C9] rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase font-semibold text-[#1F6F5C]">
            <Wallet size={13} /> Caixa em {monthLabel}
          </div>
          <button onClick={() => setOpen(true)} className="text-[11px] bg-[#1F6F5C] text-white px-2 py-1 rounded-full flex items-center gap-1">
            <Pencil size={10} /> Editar
          </button>
        </div>
        <div className="font-mono text-xl font-bold text-[#1B2430]">{fmt(amount)}</div>
        <div className="text-[11px] text-[#8A8D82]">Saldo livre do mês anterior. Ajuste se gastou/emprestou sem lançar.</div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[380px] bg-[#FBFAF6] border-[#D9D6C9]">
          <DialogHeader>
            <DialogTitle className="text-sm">Caixa inicial — {monthLabel}</DialogTitle>
            <p className="text-xs text-[#8A8D82]">Quanto você tem em caixa no início deste mês? Deixe em branco para usar o saldo anterior automaticamente. Você pode editar a qualquer momento.</p>
          </DialogHeader>
          <form action={handleSave} className="space-y-4">
            <input type="hidden" name="period" value={period} />
            <div className="space-y-2">
              <label className="text-xs font-semibold">Valor em caixa</label>
              <CurrencyInput name="amount" value={value} onValueChange={setValue} placeholder="R$ 0,00" className="bg-white" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1F6F5C]">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
