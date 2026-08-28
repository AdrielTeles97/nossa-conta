"use client";

import { useEffect, useState } from "react";
import { getCategories, createCategory } from "@/app/actions/categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Category = { id: string; name: string; type: string };

export function CategorySelect({
  type,
  value,
  onChange,
  name,
  required,
}: {
  type: string;
  value?: string;
  onChange?: (v: string) => void;
  name?: string;
  required?: boolean;
}) {
  const [cats, setCats] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const FALLBACK: Record<string, string[]> = {
    income: ["Geral", "Salário", "Freelance", "Investimentos", "Outros"],
    fixed: ["Geral", "Moradia", "Saúde", "Educação", "Assinaturas", "Transporte", "Outros"],
    variable: ["Alimentação", "Transporte", "Lazer", "Saúde", "Outros"],
    asset: ["Imóvel", "Veículo", "Reserva", "Outros"],
    debt: ["Financiamento", "Cartão", "Empréstimo", "Outros"],
  };

  useEffect(() => {
    getCategories(type)
      .then((data) => {
        if (data && data.length > 0) setCats(data);
        else setCats((FALLBACK[type] || FALLBACK.variable).map((n, i) => ({ id: `fb-${i}`, name: n, type })));
      })
      .catch(() => {
        setCats((FALLBACK[type] || FALLBACK.variable).map((n, i) => ({ id: `fb-${i}`, name: n, type })));
      });
  }, [type]);

  async function handleAdd() {
    if (!newName.trim()) return;
    const fd = new FormData();
    fd.set("name", newName.trim());
    fd.set("type", type);
    const res = await createCategory(fd);
    if (!res?.error) {
      const updated = await getCategories(type);
      setCats(updated);
      onChange?.(newName.trim());
      setNewName("");
      setShowAdd(false);
    } else {
      alert(res.error);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          name={name}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          required={required}
          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
        >
          <option value="">Selecione</option>
          {cats.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" size="icon" onClick={() => setShowAdd((v) => !v)} title="Nova categoria">
          <Plus size={16} />
        </Button>
      </div>
      {showAdd && (
        <div className="flex gap-2">
          <Input placeholder="Nova categoria" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-white" />
          <Button type="button" onClick={handleAdd} className="bg-[#1F6F5C] hover:bg-[#154E41]">
            Criar
          </Button>
        </div>
      )}
    </div>
  );
}
