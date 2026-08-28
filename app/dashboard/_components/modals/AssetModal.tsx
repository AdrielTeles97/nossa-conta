"use client";

import { useState, useEffect } from "react";
import { addAsset, updateAsset } from "@/app/actions/patrimonio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CategorySelect } from "@/components/ui/category-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";

type Data = { id: string; name: string; category: string; value: any };

export function AssetModal({ asset }: { asset?: Data }) {
  const isEdit = !!asset;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [down, setDown] = useState("");
  const [balance, setBalance] = useState("");
  const [category, setCategory] = useState(asset?.category || "Veículo");
  const fmt = (v: any) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    if (open && isEdit && asset) {
      setValue(fmt(asset.value));
      setDown("");
      setBalance("");
      setCategory(asset.category);
    } else if (open) {
      setValue("");
      setDown("");
      setBalance("");
      setCategory("Veículo");
    }
  }, [open, isEdit, asset]);

  async function action(fd: FormData) {
    if (isEdit) await updateAsset(fd);
    else await addAsset(fd);
    setOpen(false);
  }

  return (
    <>
      {isEdit ? (
        <button onClick={() => setOpen(true)} className="p-1 text-[#8A8D82] hover:text-[#1B2430]" title="Editar">
          <Pencil size={14} />
        </button>
      ) : (
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setOpen(true)}>
          <Plus size={12} /> Adicionar
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px] bg-[#FBFAF6] border-[#D9D6C9]">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar Bem" : "Novo bem"}</DialogTitle>
            <p className="text-xs text-[#8A8D82]">Ex: carro 60.000, entrada 35.000, parcelado 24x vira dívida fixa automática.</p>
          </DialogHeader>
          <form action={action} className="space-y-4">
            {isEdit && <input type="hidden" name="id" value={asset!.id} />}
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input name="name" defaultValue={asset?.name} placeholder="Ex: Carro" required className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <CategorySelect type="asset" name="category" value={category} onChange={setCategory} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor total</Label>
                <CurrencyInput name="value" value={value} onValueChange={setValue} required className="bg-white" />
              </div>
              {!isEdit && (
                <div className="space-y-2">
                  <Label>Entrada (opcional)</Label>
                  <CurrencyInput name="downPayment" value={down} onValueChange={setDown} className="bg-white" />
                </div>
              )}
            </div>
            {!isEdit && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Parcelas totais</Label>
                    <Input name="installments" type="number" min="0" defaultValue="24" className="bg-white" placeholder="24" />
                  </div>
                  <div className="space-y-2">
                    <Label>Parcelas já pagas</Label>
                    <Input name="paidInstallments" type="number" min="0" defaultValue="0" className="bg-white" placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Dia vencimento</Label>
                    <Input name="dueDay" type="number" min="1" max="31" defaultValue={String(new Date().getDate())} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Saldo restante (opcional)</Label>
                    <CurrencyInput name="balance" value={balance} onValueChange={setBalance} placeholder="ex: R$ 9.989" className="bg-white" />
                  </div>
                </div>
                <p className="text-[11px] text-[#8A8D82]">Se o financiamento já está andando, informe quantas parcelas já pagou (ex: 15/24) e o saldo que ainda falta. Se deixar em branco, calculamos automaticamente. Ideal para a moto: 24x com 15 pagas → faltam 9.989.</p>
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
