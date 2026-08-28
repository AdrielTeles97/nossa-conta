"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { joinHousehold, inviteByEmail } from "@/app/actions/household";
import { ChevronDown, ChevronUp, Users } from "lucide-react";

export function HouseholdShareCard({ householdId, inviteCode }: { householdId: string; inviteCode: string }) {
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  async function handleJoin(formData: FormData) {
    const res = await joinHousehold(formData);
    if (res?.error) setMsg(res.error);
    else if (res?.success) {
      setMsg("Entrou no household com sucesso! Recarregando...");
      window.location.reload();
    }
  }
  async function handleInvite(formData: FormData) {
    const res = await inviteByEmail(formData);
    if (res?.error) setMsg(res.error);
    else if (res?.success) {
      setMsg("Usuário adicionado à sua família!");
      setTimeout(() => window.location.reload(), 1000);
    }
  }

  return (
    <Card className="bg-white border-[#D9D6C9] shadow-sm rounded-2xl">
      <CardContent className={`${collapsed ? 'p-3' : 'p-5'} space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#1F6F5C] text-white flex items-center justify-center"><Users size={14} /></div>
            <div>
              <h3 className="font-bold text-[#1B2430] text-sm leading-none">Painel em família</h3>
              <p className="text-[11px] text-[#8A8D82]">{collapsed ? `Código: ${inviteCode.slice(0,8)}… • clique para gerenciar` : 'Compartilhado • mesmo orçamento e visão geral'}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <><ChevronDown size={14} className="mr-1" /> Expandir</> : <><ChevronUp size={14} className="mr-1" /> Minimizar</>}
          </Button>
        </div>
        {collapsed ? null : (
          <>
            <div>
              <p className="text-xs text-[#8A8D82]">Você e sua esposa veem os mesmos dados. Compartilhe o código ou convide por email (a pessoa precisa já ter cadastro).</p>
            </div>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
          <div className="flex-1 w-full">
            <Label className="text-xs font-semibold">Seu código de convite</Label>
            <div className="flex gap-2 mt-1">
              <Input value={inviteCode} readOnly className="bg-[#F1F0EA] font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#F1F0EA]">
          <form action={handleJoin} className="space-y-2">
            <Label className="text-xs font-semibold">Entrar com código (da sua esposa)</Label>
            <div className="flex gap-2">
              <Input name="inviteCode" placeholder="cole o código aqui" required className="bg-white" />
              <Button type="submit" className="bg-[#1F6F5C] hover:bg-[#154E41] whitespace-nowrap">
                Entrar
              </Button>
            </div>
          </form>

          <form action={handleInvite} className="space-y-2">
            <Label className="text-xs font-semibold">Convidar por email</Label>
            <div className="flex gap-2">
              <Input name="email" type="email" placeholder="esposa@email.com" required className="bg-white" />
              <Button type="submit" className="bg-[#1F6F5C] hover:bg-[#154E41]">
                Convidar
              </Button>
            </div>
          </form>
        </div>

        {msg && <p className="text-xs font-medium text-[#1F6F5C] bg-green-50 border border-green-200 rounded-md p-2">{msg}</p>}
        <p className="text-[11px] text-[#8A8D82]">Dica: ambos podem criar conta separada e depois um entra com o código do outro. A partir daí o orçamento e visão geral ficam idênticos.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
