// src/app/dashboard/layout.tsx
import { Wallet, Landmark, Home, PiggyBank, Settings } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { MobileNav } from "./_components/MobileNav";
import { BottomNav } from "./_components/BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const menuItems = [
    { name: "Visão geral", path: "/dashboard", icon: Wallet },
    { name: "Gastos Mensais", path: "/dashboard/orcamento", icon: Landmark },
    { name: "Patrimônio", path: "/dashboard/patrimonio", icon: Home },
    { name: "Investimentos", path: "/dashboard/investimentos", icon: PiggyBank },
    { name: "Configurações", path: "/dashboard/configuracoes", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F1F0EA] font-inter text-[#1B2430] flex">
      
      {/* SIDEBAR LATERAL */}
      <aside className="w-64 bg-[#FBFAF6] border-r border-[#D9D6C9] flex flex-col justify-between hidden md:flex p-6">
        <div>
          {/* Logo / Título */}
          <div className="mb-8">
            <span className="text-[11px] tracking-widest text-[#8A8D82] uppercase font-semibold">
              Nossa Conta
            </span>
            <h2 className="font-heading text-2xl font-semibold text-[#1B2430] mt-1">
              Finanças em família
            </h2>
          </div>

          {/* Links de Navegação */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13.5px] font-semibold text-[#4A5160] hover:bg-[#E8E6DD] hover:text-[#1B2430] transition-colors"
              >
                <item.icon size={17} className="text-[#1F6F5C]" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Rodapé da Sidebar (Usuário / Sair) */}
        <div className="pt-4 border-t border-[#D9D6C9]">
          <div className="text-xs text-[#8A8D82] mb-2 font-mono truncate">
            Sessão Ativa
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Mobile — shadcn Sheet, mobile-first */}
        <header className="md:hidden sticky top-0 z-30 bg-[#FBFAF6]/95 backdrop-blur border-b border-[#D9D6C9] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MobileNav />
            <span className="font-heading font-semibold text-[16px] text-[#1B2430]">Nossa Conta</span>
          </div>
          <span className="text-[11px] tracking-widest uppercase font-semibold text-[#8A8D82]">Finanças</span>
        </header>

        {/* Container das Páginas */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden pb-20 md:pb-8">
          {children}
        </main>
        <BottomNav />
      </div>

    </div>
  );
}