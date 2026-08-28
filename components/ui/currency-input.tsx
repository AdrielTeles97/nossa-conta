"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { maskCurrencyInput, parseCurrencyBRL } from "@/lib/masks";

type CurrencyInputProps = Omit<React.ComponentProps<"input">, "value" | "type"> & {
  value?: string; // masked value e.g. "R$ 1.234,56"
  defaultValue?: string;
  onValueChange?: (masked: string, numeric: number) => void;
};

function CurrencyInput({ value, defaultValue, onValueChange, ...props }: CurrencyInputProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? value ?? "");

  // sync controlled value
  React.useEffect(() => {
    if (value !== undefined) setInternal(value);
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const masked = maskCurrencyInput(raw);
    setInternal(masked);
    const numeric = parseCurrencyBRL(masked);
    onValueChange?.(masked, numeric);
    // forward to original onChange if provided via props
    const originalOnChange = (props as { onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }).onChange;
    if (originalOnChange) {
      const synthetic = { ...e, target: { ...e.target, value: masked } } as React.ChangeEvent<HTMLInputElement>;
      originalOnChange(synthetic);
    }
  }

  return <Input type="text" inputMode="numeric" placeholder="R$ 0,00" {...props} value={internal} onChange={handleChange} />;
}

export { CurrencyInput };
