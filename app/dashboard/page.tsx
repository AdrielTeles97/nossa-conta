// src/app/dashboard/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    TrendingUp,
    TrendingDown,
    PiggyBank,
    Wallet,
    Home,
} from 'lucide-react';

export default function OverviewPage() {
    // Valores estáticos por enquanto. Na Fase 4, vamos puxar isso do Prisma.
    const totalIncome = 0;
    const totalExpenses = 0;
    const investPlan = 0;
    const balance = 0;
    const netWorth = 0;

    const fmt = (v: number) =>
        (v || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Card className="bg-[#FBFAF6] border-[#D9D6C9]">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[11px] tracking-widest uppercase font-semibold text-[#1F6F5C] flex items-center gap-1.5">
                            <TrendingUp size={13} /> Receita
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="font-mono text-[22px] font-semibold tracking-tight text-[#1F6F5C]">
                            {fmt(totalIncome)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#FBFAF6] border-[#D9D6C9]">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[11px] tracking-widest uppercase font-semibold text-[#B23B3B] flex items-center gap-1.5">
                            <TrendingDown size={13} /> Despesas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="font-mono text-[22px] font-semibold tracking-tight text-[#B23B3B]">
                            {fmt(totalExpenses)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#FBFAF6] border-[#D9D6C9]">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[11px] tracking-widest uppercase font-semibold text-[#B8873B] flex items-center gap-1.5">
                            <PiggyBank size={13} /> Aporte
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="font-mono text-[22px] font-semibold tracking-tight text-[#B8873B]">
                            {fmt(investPlan)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#FBFAF6] border-[#D9D6C9]">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[11px] tracking-widest uppercase font-semibold text-[#8A8D82] flex items-center gap-1.5">
                            <Wallet size={13} /> Saldo do Mês
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="font-mono text-[22px] font-semibold tracking-tight text-[#1B2430]">
                            {fmt(balance)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#FBFAF6] border-[#D9D6C9]">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[11px] tracking-widest uppercase font-semibold text-[#8A8D82] flex items-center gap-1.5">
                            <Home size={13} /> Patrimônio
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="font-mono text-[22px] font-semibold tracking-tight text-[#1B2430]">
                            {fmt(netWorth)}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
