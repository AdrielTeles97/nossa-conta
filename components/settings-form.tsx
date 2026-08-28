"use client";

import { useState } from "react";
import { updateProfile, changePassword } from "@/app/actions/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsForm({ user }: { user: { name: string | null; email: string } }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleProfile(fd: FormData) {
    setErr(null); setMsg(null);
    const res = await updateProfile(fd);
    if (res?.error) setErr(res.error);
    else setMsg("Perfil atualizado!");
  }
  async function handlePassword(fd: FormData) {
    setErr(null); setMsg(null);
    const res = await changePassword(fd);
    if (res?.error) setErr(res.error);
    else {
      setMsg("Senha alterada com sucesso!");
      (document.getElementById("pwd-form") as HTMLFormElement)?.reset();
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-white border-none shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm">Informações pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input name="name" defaultValue={user.name || ""} placeholder="Seu nome" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={user.email} className="bg-white" />
            </div>
            <Button type="submit" className="bg-[#1F6F5C] w-full">Salvar</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white border-none shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm">Trocar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="pwd-form" action={handlePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Senha atual</Label>
              <Input name="currentPassword" type="password" required className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <Input name="newPassword" type="password" required className="bg-white" />
            </div>
            <Button type="submit" className="bg-[#1B2430] w-full">Alterar senha</Button>
          </form>
        </CardContent>
      </Card>

      {(msg || err) && (
        <div className={`lg:col-span-2 p-3 rounded-md text-sm ${err ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {err || msg}
        </div>
      )}
    </div>
  );
}
