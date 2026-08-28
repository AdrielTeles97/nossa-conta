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
};

export function IncomeModal({ income }: { income?: IncomeData }) {
  const isEdit = !!income;
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [value, setValue] = useState("");
  const [category, setCategory] = useState(income?.category || "Geral");
  const [isRecurring, setIsRecurring] = useState(income?.isRecurring || false);

  const fmtCurrency = (v: any) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    if (open) {
      if (isEdit && income) {
        setDate(income.createdAt ? new Date(income.createdAt) : new Date());
        setValue(fmtCurrency(income.value));
        setCategory(income.category || "Geral");
        setIsRecurring(!!income.isRecurring);
      } else {
        setDate(new Date());
        setValue("");
        setCategory("Geral");
        setIsRecurring(false);
      }
    }
  }, [open, isEdit, income]);

  async function clientAction(formData: FormData) {
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
        <DialogContent className="sm:max-w-[425px] bg-[#FBFAF6] border-[#D9D6C9]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#1B2430]">{isEdit ? "Editar Receita" : "Nova Receita"}</DialogTitle>
            <p className="text-sm text-[#8A8D82]">{isEdit ? "Altere os dados e salve." : "Lançamento deste mês."}</p>
          </DialogHeader>

          <form action={clientAction} className="space-y-5 mt-2">
            {isEdit && <input type="hidden" name="id" value={income!.id} />}
            <div className="space-y-2">
              <Label className="text-[#4A5160] font-semibold">Data</Label>
              <DatePicker value={date} onChange={setDate} name="date" placeholder="Selecione a data" className="bg-white" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value" className="text-[#4A5160] font-semibold">Valor</Label>
              <CurrencyInput id="value" name="value" required className="bg-white" value={value} onValueChange={(m) => setValue(m)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#4A5160] font-semibold">Descrição</Label>
              <Input id="name" name="name" defaultValue={income?.name} placeholder="Ex: Salário" required className="bg-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-[#4A5160] font-semibold">Categoria</Label>
              <CategorySelect type="income" name="category" value={category} onChange={setCategory} required />
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-lg border bg-white border-[#E8E6DD] cursor-pointer hover:bg-[#F9F9F7]">
              <input
                type="checkbox"
                name="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1F6F5C] focus:ring-[#1F6F5C]"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-[#1B2430]">Tornar recorrente</div>
                <div className="text-xs text-[#8A8D82]">Repete todo mês automaticamente (igual despesa fixa). Ideal para salário fixo da esposa. Desmarque para renda variável com comissão.</div>
              </div>
            </label>

            <DialogFooter className="mt-6 gap-2 sm:gap-0">
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
