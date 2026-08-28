"use client";

import { useState, useEffect } from "react";
import { addDebt, updateDebt } from "@/app/actions/patrimonio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";

type Data = { id: string; name: string; balance: any; installment: any; totalInstallments?: number; paidInstallments?: number; dueDay?: number };

export function DebtModal({ debt }: { debt?: Data }) {
  const isEdit = !!debt;
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState("");
  const [installment, setInstallment] = useState("");
  const fmt = (v: any) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    if (open && isEdit && debt) {
      setBalance(fmt(debt.balance));
      setInstallment(fmt(debt.installment));
    } else if (open) {
      setBalance("");
      setInstallment("");
    }
  }, [open, isEdit, debt]);

  async function action(fd: FormData) {
    if (isEdit) await updateDebt(fd);
    else await addDebt(fd);
    setOpen(false);
  }

  return (
    <>
      {isEdit ? (
        <button onClick={() => setOpen(true)} className="p-1 text-[#8A8D82] hover:text-[#1B2430]" title="Editar dívida">
          <Pencil size={14} />
        </button>
      ) : (
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setOpen(true)}>
          <Plus size={12} /> Nova dívida
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px] bg-[#FBFAF6] border-[#D9D6C9]">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar dívida" : "Nova dívida"}</DialogTitle>
            <p className="text-xs text-[#8A8D82]">{isEdit ? "Ajuste saldo e parcelas já pagas. Ex: moto 15/24 pagas, faltam 9.989." : "Valor restante. Vira parcela fixa automaticamente."}</p>
          </DialogHeader>
          <form action={action} className="space-y-4">
            {isEdit && <input type="hidden" name="id" value={debt!.id} />}
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input name="name" defaultValue={debt?.name} placeholder="Ex: Financiamento" required className="bg-white" disabled={isEdit} />
            </div>
            {isEdit ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Saldo restante</Label>
                    <CurrencyInput name="balance" value={balance} onValueChange={setBalance} required className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Parcela</Label>
                    <CurrencyInput name="installment" value={installment} onValueChange={setInstallment} required className="bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Total parcelas</Label>
                    <Input name="totalInstallments" type="number" min="0" defaultValue={debt?.totalInstallments || 24} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Já pagas</Label>
                    <Input name="paidInstallments" type="number" min="0" defaultValue={debt?.paidInstallments || 0} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Dia</Label>
                    <Input name="dueDay" type="number" min="1" max="31" defaultValue={debt?.dueDay || String(new Date().getDate())} className="bg-white" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Valor restante</Label>
                    <CurrencyInput name="value" value={balance} onValueChange={setBalance} required className="bg-white" placeholder="Ex: R$ 9.989" />
                  </div>
                  <div className="space-y-2">
                    <Label>Parcela</Label>
                    <CurrencyInput name="installment" value={installment} onValueChange={setInstallment} placeholder="ex: R$ 1.245" className="bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Parcelas totais</Label>
                    <Input name="installments" type="number" min="1" defaultValue="24" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Já pagas</Label>
                    <Input name="paidInstallments" type="number" min="0" defaultValue="0" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Dia</Label>
                    <Input name="dueDay" type="number" min="1" max="31" defaultValue={String(new Date().getDate())} className="bg-white" />
                  </div>
                </div>
                <p className="text-[11px] text-[#8A8D82]">Ex: moto 24x, 15 pagas, faltam 9.989 — informe parcela 1.245 e saldo 9.989.</p>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1F6F5C]">{isEdit ? "Salvar" : "Adicionar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
