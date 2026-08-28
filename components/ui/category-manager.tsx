"use client";

import { useEffect, useState } from "react";
import { getCategories, createCategory, deleteCategory } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Settings } from "lucide-react";

export function CategoryManager() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("variable");
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [newName, setNewName] = useState("");

  async function load(t: string) {
    const data = await getCategories(t);
    setCats(data);
  }
  useEffect(() => {
    if (open) load(type);
  }, [open, type]);

  async function handleCreate() {
    const fd = new FormData();
    fd.set("name", newName);
    fd.set("type", type);
    const res = await createCategory(fd);
    if (!res?.error) {
      setNewName("");
      load(type);
    }
  }
  async function handleDelete(id: string) {
    await deleteCategory(id);
    load(type);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1">
        <Settings size={14} /> Categorias
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px] bg-[#FBFAF6] border-[#D9D6C9]">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-3">
            {[
              ["income", "Receita"],
              ["fixed", "Fixa"],
              ["variable", "Variável"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setType(v)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${type === v ? "bg-[#1F6F5C] text-white" : "bg-white border"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Nova categoria" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-white" />
            <Button onClick={handleCreate} className="bg-[#1F6F5C]">Criar</Button>
          </div>
          <div className="space-y-1 max-h-[240px] overflow-auto mt-3">
            {cats.map((c) => (
              <div key={c.id} className="flex justify-between items-center bg-white border rounded-md px-3 py-2 text-sm">
                {c.name}
                <button onClick={() => handleDelete(c.id)} className="text-[#B23B3B] hover:opacity-70">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {cats.length === 0 && <p className="text-xs text-[#8A8D82] text-center py-4">Nenhuma categoria</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
