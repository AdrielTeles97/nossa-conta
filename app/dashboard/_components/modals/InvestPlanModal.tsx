// src/components/modals/InvestPlanModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { updateInvestPlan } from '@/app/actions/budget';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';

export function InvestPlanModal({ currentPct, totalIncome = 0 }: { currentPct: number; totalIncome?: number }) {
    const [open, setOpen] = useState(false);
    const [pct, setPct] = useState(currentPct);
    const [loading, setLoading] = useState(false);

    const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const previewAmount = totalIncome * (pct / 100);

    useEffect(() => {
        if (open) setPct(currentPct);
    }, [open, currentPct]);

    async function handleSave() {
        setLoading(true);
        await updateInvestPlan(pct);
        setLoading(false);
        setOpen(false);
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-full font-bold cursor-pointer hover:bg-blue-700 flex items-center gap-1 shadow-sm"
            >
                Ajustar <Edit2 size={10} />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[350px] bg-[#FBFAF6] border-[#D9D6C9]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-[#1B2430] text-center">
                            Investir
                        </DialogTitle>
                        <p className="text-sm text-[#8A8D82] text-center">
                            Quanto da sua receita você reserva?
                        </p>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-4 py-6">
                        <span className="text-5xl font-bold text-blue-600">
                            {pct}%
                        </span>
                        <div className="text-center -mt-2">
                            <p className="text-sm font-semibold text-[#1B2430]">{fmt(previewAmount)} <span className="font-normal text-[#8A8D82]">este mês</span></p>
                            <p className="text-[11px] text-[#8A8D82] mt-0.5">
                                {totalIncome > 0 ? `de ${fmt(totalIncome)} em receitas` : "adicione receitas para calcular"}
                            </p>
                        </div>

                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={pct}
                            onChange={e => setPct(Number(e.target.value))}
                            className="w-full accent-blue-600"
                        />

                        <div className="flex gap-2 w-full justify-center">
                            {[10, 20, 30, 40].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setPct(v)}
                                    className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${pct === v ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {v}%
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="bg-[#1F6F5C] hover:bg-[#154E41]"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
