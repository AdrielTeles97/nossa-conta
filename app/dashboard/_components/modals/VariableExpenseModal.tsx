'use client';

import { useState, useEffect } from 'react';
import { addVariableExpense, updateVariableExpense } from '@/app/actions/budget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';
import { CategorySelect } from '@/components/ui/category-select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil } from 'lucide-react';

type Data = { id: string; name: string; value: any; category: string; date: string | Date };

export function VariableExpenseModal({ expense }: { expense?: Data }) {
    const isEdit = !!expense;
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [value, setValue] = useState("");
    const [category, setCategory] = useState(expense?.category || "Alimentação");

    const fmtCurrency = (v: any) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    useEffect(() => {
        if (open) {
            if (isEdit && expense) {
                setDate(new Date(expense.date));
                setValue(fmtCurrency(expense.value));
                setCategory(expense.category);
            } else {
                setDate(new Date());
                setValue("");
                setCategory("Alimentação");
            }
        }
    }, [open, isEdit, expense]);

    async function clientAction(formData: FormData) {
        if (isEdit) await updateVariableExpense(formData);
        else await addVariableExpense(formData);
        setOpen(false);
    }

    return (
        <>
            {isEdit ? (
                <button onClick={() => setOpen(true)} className="text-[#8A8D82] hover:text-[#1B2430] p-1" title="Editar">
                    <Pencil size={14} />
                </button>
            ) : (
                <Button variant="outline" className="flex items-center gap-2 text-sm font-semibold h-9" onClick={() => setOpen(true)}>
                    <Plus size={16} /> Adicionar
                </Button>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px] bg-[#FBFAF6] border-[#D9D6C9]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-[#1B2430]">{isEdit ? "Editar Despesa Variável" : "Nova Despesa Variável"}</DialogTitle>
                    </DialogHeader>

                    <form action={clientAction} className="space-y-4 mt-2">
                        {isEdit && <input type="hidden" name="id" value={expense!.id} />}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <DatePicker value={date} onChange={setDate} name="date" placeholder="Selecione a data" className="bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Valor</Label>
                                <CurrencyInput id="value" name="value" required className="bg-white" value={value} onValueChange={(m) => setValue(m)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Descrição</Label>
                            <Input id="name" name="name" defaultValue={expense?.name} placeholder="Ex: Supermercado" required className="bg-white" />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <CategorySelect type="variable" name="category" value={category} onChange={setCategory} required />
                        </div>
                        <DialogFooter className="mt-6">
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
