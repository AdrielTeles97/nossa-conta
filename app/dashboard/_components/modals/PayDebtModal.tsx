"use client";

import { useState, useEffect } from "react";
import { payDebtInstallment } from "@/app/actions/patrimonio";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Debt = { id: string; name: string; installment: any; dueDay: number };

export function PayDebtModal({ debt }: { debt: Debt }) {
  const [open, setOpen] = useState(false);
  const [competence, setCompetence] = useState(() => {
    const now = new Date();
    const due = debt.dueDay || 10;
    const cur = now.getDate() <= due ? now : new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
  });
  const [paidAt, setPaidAt] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState("");

  const fmt = (v: any) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    if (open) {
      setAmount(fmt(debt.installment));
      const now = new Date();
      const due = debt.dueDay || 10;
      const cur = now.getDate() <= due ? now : new Date(now.getFullYear(), now.getMonth() + 1, 1);
      setCompetence(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`);
      setPaidAt(new Date());
    }
  }, [open, debt]);

  async function handleSubmit(fd: FormData) {
    // hidden fields already set, just call
    const res: any = await payDebtInstallment(fd);
    if (res?.error) alert(res.error);
    else setOpen(false);
  }

  const dueLabel = competence ? `${String(debt.dueDay).padStart(2, "0")}/${competence.split("-")[1]}/${competence.split("-")[0]}` : "";

  return (
    <>
      <Button size="sm" className="bg-[#1F6F5C] hover:bg-[#154E41] text-xs h-7 px-3" onClick={() => setOpen(true)}>
        Pagar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px] bg-[#FBFAF6] border-[#D9D6C9]">
          <DialogHeader>
            <DialogTitle className="text-sm">Pagar parcela — {debt.name}</DialogTitle>
            <p className="text-xs text-[#8A8D82]">Parcela {fmt(debt.installment)} vence dia {debt.dueDay}. Informe quando pagou e a qual competência pertence.</p>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="debtId" value={debt.id} />
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Mês de referência (competência)</Label>
              <MonthYearPicker value={competence} onChange={setCompetence} />
              <input type="hidden" name="competence" value={competence} />
              <p className="text-[11px] text-[#8A8D82]">Vencimento: <b>{dueLabel}</b> — ex: pago em 28/08 mas vence 15/09 → competência 2026-09</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Data do pagamento</Label>
                <DatePicker value={paidAt} onChange={setPaidAt} name="paidAt" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Valor pago</Label>
                <CurrencyInput name="amount" value={amount} onValueChange={setAmount} className="bg-white" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1F6F5C]">Confirmar pagamento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
