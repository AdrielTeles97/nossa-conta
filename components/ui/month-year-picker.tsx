"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export function MonthYearPicker({ value, onChange, placeholder = "Selecione o mês" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => {
    if (value) return parseInt(value.split("-")[0]);
    return new Date().getFullYear();
  });

  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const display = value ? new Date(parseInt(value.split("-")[0]), parseInt(value.split("-")[1]) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" className="w-full justify-start text-left font-normal bg-white h-10" />}
      >
        <CalendarIcon size={14} className="mr-2 opacity-60" />
        {display ? <span className="capitalize">{display}</span> : <span className="text-muted-foreground">{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <div className="flex items-center justify-between p-3 border-b">
          <Button variant="ghost" size="icon-sm" onClick={() => setYear((y) => y - 1)}><ChevronLeft size={16} /></Button>
          <span className="font-bold text-sm">{year}</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setYear((y) => y + 1)}><ChevronRight size={16} /></Button>
        </div>
        <div className="grid grid-cols-3 gap-1 p-3">
          {months.map((m, idx) => {
            const mm = String(idx + 1).padStart(2, "0");
            const v = `${year}-${mm}`;
            const active = v === value;
            return (
              <button
                key={v}
                onClick={() => { onChange(v); setOpen(false); }}
                className={`py-2 text-xs font-medium rounded-md capitalize ${active ? "bg-[#1F6F5C] text-white" : "hover:bg-[#F1F0EA] text-[#1B2430]"}`}
              >
                {m}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between p-2 border-t">
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { onChange(""); setOpen(false); }}>Limpar</Button>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { const now = new Date().toISOString().slice(0,7); onChange(now); setYear(new Date().getFullYear()); setOpen(false); }}>Este mês</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
