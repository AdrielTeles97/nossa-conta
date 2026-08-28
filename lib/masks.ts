// lib/masks.ts
// Utilitários de máscara para moeda BRL e datas

export function formatCurrencyBRL(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Formata input em tempo real: "1234.5" -> "R$ 1.234,50"
// Usa centavos: digite 1234 => R$ 12,34 se usar base centavos.
// Para simplificar, formatamos como BRL normal a partir do número digitado.
export function maskCurrencyInput(raw: string): string {
  // Remove tudo que não é dígito
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // Interpreta como centavos
  const cents = parseInt(digits, 10);
  const value = cents / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function parseCurrencyBRL(masked: string): number {
  if (!masked) return 0;
  // "R$ 1.234,56" -> 1234.56
  const cleaned = masked
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Retorna YYYY-MM-DD para input date nativo, baseado na data local
export function toDateInputValue(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateBR(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}
