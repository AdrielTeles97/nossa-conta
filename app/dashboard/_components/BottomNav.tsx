"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Landmark, Home, PiggyBank, Settings } from "lucide-react";

const items = [
  { name: "Visão", path: "/dashboard", icon: Wallet },
  { name: "Gastos", path: "/dashboard/orcamento", icon: Landmark },
  { name: "Patrimônio", path: "/dashboard/patrimonio", icon: Home },
  { name: "Investir", path: "/dashboard/investimentos", icon: PiggyBank },
  { name: "Ajustes", path: "/dashboard/configuracoes", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#FBFAF6] border-t border-[#D9D6C9] flex justify-around items-center py-1.5 px-1">
      {items.map((item) => {
        const active = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold min-w-[52px] ${active ? "text-[#1F6F5C] bg-[#E8E6DD]" : "text-[#8A8D82]"}`}
          >
            <item.icon size={18} className={active ? "text-[#1F6F5C]" : "text-[#8A8D82]"} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
