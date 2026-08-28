import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings-form";

export default async function ConfiguracoesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return <div className="p-6">Não autorizado</div>;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } });
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B2430]">Configurações</h2>
        <p className="text-xs text-[#8A8D82]">Edite nome, email e senha. Household compartilhado continua igual.</p>
      </div>
      <SettingsForm user={{ name: user?.name || "", email: user?.email || session.user.email }} />
    </div>
  );
}
