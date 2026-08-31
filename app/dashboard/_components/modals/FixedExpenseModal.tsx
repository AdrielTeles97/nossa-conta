'use client';

import { useState, useEffect } from 'react';
import { addFixedExpense, updateFixedExpense } from '@/app/actions/budget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CategorySelect } from '@/components/ui/category-select';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil } from 'lucide-react';

type Data = { id: string; name: string; value: any; category: string; dueDay: number; period?: string | null; isRecurring?: boolean; createdAt?: string | Date };

export function FixedExpenseModal({ expense, currentPeriod }: { expense?: Data; currentPeriod?: string }) {
    const isEdit = !!expense;
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [category, setCategory] = useState(expense?.category || "Moradia");
    const [dueDay, setDueDay] = useState<string>(String(expense?.dueDay || new Date().getDate()));
    const [isRecurring, setIsRecurring] = useState(expense?.isRecurring ?? true);
    const [period, setPeriod] = useState(expense?.period || currentPeriod || new Date().toISOString().slice(0, 7));

    const fmtCurrency = (v: any) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    useEffect(() => {
        if (open) {
            if (isEdit && expense) {
                setValue(fmtCurrency(expense.value));
                setCategory(expense.category);
                setDueDay(String(expense.dueDay));
                setIsRecurring(expense.isRecurring ?? true);
                setPeriod(expense.period || currentPeriod || new Date().toISOString().slice(0, 7));
            } else {
                setValue("");
                setCategory("Moradia");
                setDueDay(String(new Date().getDate()));
                setIsRecurring(true);
                setPeriod(currentPeriod || new Date().toISOString().slice(0, 7));
            }
        }
    }, [open, isEdit, expense, currentPeriod]);

    async function clientAction(formData: FormData) {
        if (isEdit) await updateFixedExpense(formData);
        else await addFixedExpense(formData);
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
                        <DialogTitle className="text-xl font-semibold text-[#1B2430]">{isEdit ? "Editar Despesa Fixa" : "Nova Despesa Fixa"}</DialogTitle>
                    </DialogHeader>

                    <form action={clientAction} className="space-y-4 mt-2">
                        {isEdit && <input type="hidden" name="id" value={expense!.id} />}
                        <input type="hidden" name="isRecurring" value={isRecurring ? "true" : "false"} />
                        {!isRecurring && <input type="hidden" name="period" value={period} />}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dueDay">Dia do Vencimento</Label>
                                <Input id="dueDay" name="dueDay" type="number" min="1" max="31" required className="bg-white" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Valor</Label>
                                <CurrencyInput id="value" name="value" required className="bg-white" value={value} onValueChange={(m) => setValue(m)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Descrição</Label>
                            <Input id="name" name="name" defaultValue={expense?.name} placeholder="Ex: Aluguel" required className="bg-white" />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <CategorySelect type="fixed" name="category" value={category} onChange={setCategory} required />
                        </div>
                        <label className="flex items-center gap-2 p-3 rounded-lg border bg-white cursor-pointer">
                            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#1F6F5C]" />
                            <div>
                                <div className="text-sm font-semibold">Recorrente todo mês</div>
                                <div className="text-xs text-[#8A8D82]">Desmarque para lançar só em um mês futuro (ex: março)</div>
                            </div>
                        </label>
                        {!isRecurring && (
                            <div className="space-y-2">
                                <Label>Mês de competência</Label>
                                <MonthYearPicker value={period} onChange={setPeriod} />
                                <p className="text-[11px] text-[#8A8D82]">Será exibida só em <span className="capitalize font-semibold">{period ? new Date(parseInt(period.split('-')[0]), parseInt(period.split('-')[1])-1, 1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}) : period}</span> — ideal para despesa futura lançada em agosto para março.</p>
                            </div>
                        )}
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
