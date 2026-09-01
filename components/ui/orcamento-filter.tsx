"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/app/actions/categories";

export function OrcamentoFilter({ currentTab }: { currentTab: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const period = searchParams.get("period") || "";
  const tab = searchParams.get("tab") || currentTab;

  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);

  const typeMap: Record<string, string> = { receita: "income", fixa: "fixed", variavel: "variable" };
  const type = typeMap[tab] || "variable";

  useEffect(() => {
    getCategories(type).then(setCats).catch(() => setCats([]));
  }, [type]);

  function setCategory(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    if (period) params.set("period", period);
    if (cat) params.set("category", cat);
    else params.delete("category");
    router.push(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" className="flex items-center gap-2 text-xs font-semibold h-9 bg-white border-[#D9D6C9]" />}
      >
        <Filter size={14} /> {activeCategory ? activeCategory : "Filtro"} {activeCategory && <X size={12} className="ml-1" onClick={(e) => { e.stopPropagation(); setCategory(""); }} />}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <div className="text-xs font-semibold mb-2">Filtrar por categoria</div>
        <div className="space-y-1 max-h-[200px] overflow-auto">
          <button
            onClick={() => setCategory("")}
            className={`w-full text-left px-3 py-2 rounded-md text-xs ${!activeCategory ? "bg-[#1F6F5C] text-white" : "hover:bg-gray-100"}`}
          >
            Todas
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.name)}
              className={`w-full text-left px-3 py-2 rounded-md text-xs flex justify-between ${activeCategory === c.name ? "bg-[#1F6F5C] text-white" : "hover:bg-gray-100"}`}
            >
              {c.name}
              {activeCategory === c.name && <span>✓</span>}
            </button>
          ))}
          {cats.length === 0 && <p className="text-xs text-[#8A8D82] py-2">Nenhuma categoria</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
