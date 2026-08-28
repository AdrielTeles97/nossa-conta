"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Wallet, Landmark, Home, PiggyBank, Settings, Menu } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";

const items = [
  { name: "Visão geral", path: "/dashboard", icon: Wallet },
  { name: "Gastos Mensais", path: "/dashboard/orcamento", icon: Landmark },
  { name: "Patrimônio", path: "/dashboard/patrimonio", icon: Home },
  { name: "Investimentos", path: "/dashboard/investimentos", icon: PiggyBank },
  { name: "Configurações", path: "/dashboard/configuracoes", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" />
        }
      >
        <Menu size={20} />
        <span className="sr-only">Abrir navegação</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-[#FBFAF6] border-[#D9D6C9]">
        <SheetHeader className="p-6 pb-4 border-b border-[#D9D6C9] text-left">
          <span className="text-[11px] tracking-widest text-[#8A8D82] uppercase font-semibold">Nossa Conta</span>
          <SheetTitle className="font-heading text-xl text-[#1B2430] mt-1">Finanças em família</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-4">
          {items.map((item) => {
            const active = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-[14px] font-semibold transition-colors ${
                  active ? "bg-[#1F6F5C] text-white shadow-sm" : "text-[#4A5160] hover:bg-[#E8E6DD] hover:text-[#1B2430]"
                }`}
              >
                <item.icon size={18} className={active ? "text-white" : "text-[#1F6F5C]"} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4 border-t border-[#D9D6C9]">
          <div className="text-xs text-[#8A8D82] mb-2 font-mono">Sessão Ativa</div>
          <LogoutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
