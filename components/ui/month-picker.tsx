"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export function MonthPicker({ period }: { period: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => parseInt(period.split("-")[0]));

  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];

  const [y, m] = period.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  function goTo(newPeriod: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", newPeriod);
    router.push(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  }

  const prev = new Date(y, m - 2, 1).toISOString().slice(0, 7);
  const next = new Date(y, m, 1).toISOString().slice(0, 7);

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon-sm" className="h-7 w-7" onClick={() => goTo(prev)}>‹</Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button variant="outline" className="h-7 px-3 text-xs font-semibold bg-white" />}
        >
          <Calendar size={12} className="mr-1.5 opacity-60" />
          {label}
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="end">
          <div className="p-3 border-b flex items-center justify-between">
            <Button variant="ghost" size="icon-sm" onClick={() => setYear((v) => v - 1)}>‹</Button>
            <span className="font-bold text-sm">{year}</span>
            <Button variant="ghost" size="icon-sm" onClick={() => setYear((v) => v + 1)}>›</Button>
          </div>
          <div className="grid grid-cols-3 gap-1 p-3">
            {months.map((name, idx) => {
              const mm = String(idx + 1).padStart(2, "0");
              const p = `${year}-${mm}`;
              const active = p === period;
              return (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`text-xs py-2 rounded-md capitalize font-medium ${active ? "bg-[#1F6F5C] text-white" : "hover:bg-[#F1F0EA] text-[#1B2430]"}`}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
          <div className="p-2 border-t flex justify-center">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => goTo(new Date().toISOString().slice(0,7))}>Hoje</Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon-sm" className="h-7 w-7" onClick={() => goTo(next)}>›</Button>
    </div>
  );
}
