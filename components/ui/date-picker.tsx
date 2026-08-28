"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  id?: string;
  name?: string; // for form submission, hidden input will hold YYYY-MM-DD
  className?: string;
  disabled?: boolean;
};

export function DatePicker({ value, defaultValue, onChange, placeholder = "Selecione a data", id, name, className, disabled }: DatePickerProps) {
  const [internal, setInternal] = React.useState<Date | undefined>(value ?? defaultValue);

  React.useEffect(() => {
    if (value !== undefined) setInternal(value);
  }, [value]);

  // Initialize with today if no value provided - "data atual quando abrir modal"
  // Caller should pass defaultValue={new Date()} to achieve this.
  // We keep internal as undefined only if nothing passed.

  function handleSelect(date: Date | undefined) {
    setInternal(date);
    onChange?.(date);
  }

  const displayValue = internal ? format(internal, "PPP", { locale: ptBR }) : null;

  return (
    <>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              id={id}
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal bg-white",
                !internal && "text-muted-foreground",
                className
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
          {displayValue ?? <span>{placeholder}</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={internal} onSelect={handleSelect} locale={ptBR} />
        </PopoverContent>
      </Popover>
      {name && (
        <input
          type="hidden"
          name={name}
          value={internal ? `${internal.getFullYear()}-${String(internal.getMonth() + 1).padStart(2, "0")}-${String(internal.getDate()).padStart(2, "0")}` : ""}
        />
      )}
    </>
  );
}
