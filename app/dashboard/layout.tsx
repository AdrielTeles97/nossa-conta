// src/app/dashboard/layout.tsx
import { Wallet, Landmark, Home, PiggyBank } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const tabs = [
        { name: 'Visão geral', path: '/dashboard', icon: Wallet },
        { name: 'Orçamento', path: '/dashboard/orcamento', icon: Landmark },
        { name: 'Patrimônio', path: '/dashboard/patrimonio', icon: Home },
        {
            name: 'Investimentos',
            path: '/dashboard/investimentos',
            icon: PiggyBank,
        },
    ];

    return (
        <div className="min-h-screen bg-[#F1F0EA] font-inter text-[#1B2430]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                {/* Cabeçalho */}
                <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <div className="text-[11px] tracking-widest text-[#8A8D82] uppercase font-semibold">
                            Meu Ledger
                        </div>
                        <h1 className="font-fraunces text-3xl font-semibold mt-0.5">
                            Controle financeiro
                        </h1>
                    </div>
                </div>

                {/* Navegação por Abas */}
                <nav className="flex gap-1 mb-5 border-b border-[#D9D6C9]">
                    {tabs.map(tab => (
                        <Link
                            key={tab.name}
                            href={tab.path}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-[13.5px] font-semibold text-[#8A8D82] hover:bg-[#E8E6DD] transition-colors"
                        >
                            <tab.icon size={15} />
                            {tab.name}
                        </Link>
                    ))}
                </nav>

                {/* Conteúdo da Página Ativa */}
                <main>{children}</main>
            </div>
        </div>
    );
}
