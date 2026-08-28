// src/app/dashboard/layout.tsx
import { Wallet, Landmark, Home, PiggyBank, LogOut } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client"; // ou redirecionamento via Server Action de logout
import { redirect } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const menuItems = [
    { name: "Visão geral", path: "/dashboard", icon: Wallet },
    { name: "Orçamento", path: "/dashboard/orcamento", icon: Landmark },
    { name: "Patrimônio", path: "/dashboard/patrimonio", icon: Home },
    { name: "Investimentos", path: "/dashboard/investimentos", icon: PiggyBank },
  ];

  return (
    <div className="min-h-screen bg-[#F1F0EA] font-inter text-[#1B2430] flex">
      
      {/* SIDEBAR LATERAL */}
      <aside className="w-64 bg-[#FBFAF6] border-r border-[#D9D6C9] flex flex-col justify-between hidden md:flex p-6">
        <div>
          {/* Logo / Título */}
          <div className="mb-8">
            <span className="text-[11px] tracking-widest text-[#8A8D82] uppercase font-semibold">
              Meu Ledger
            </span>
            <h2 className="font-fraunces text-2xl font-semibold text-[#1B2430] mt-1">
              Painel Financeiro
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
          <form
            action={async () => {
              "use server";
              // Aqui podemos chamar o encerramento de sessão ou redirecionar para login
              redirect("/login");
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 text-xs font-semibold text-[#B23B3B] hover:opacity-80 transition-opacity w-full"
            >
              <LogOut size={14} /> Sair da conta
            </button>
          </form>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Mobile (visível apenas em telas pequenas) */}
        <header className="md:hidden bg-[#FBFAF6] border-b border-[#D9D6C9] p-4 flex items-center justify-between">
          <span className="font-fraunces font-semibold text-lg">Meu Ledger</span>
          {/* Menu mobile simplificado se necessário */}
        </header>

        {/* Container das Páginas */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}