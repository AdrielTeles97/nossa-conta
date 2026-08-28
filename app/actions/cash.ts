'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getOrCreateHouseholdForUser } from '@/lib/household';

function parseCurrency(v: string | null) {
  if (!v) return 0;
  const t = v.trim();
  if (t.includes('R$') || t.includes(',')) {
    const c = t.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(c);
    return isNaN(n) ? 0 : n;
  }
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
}

export async function setCashBalance(formData: FormData) {
  const period = formData.get('period') as string;
  const amount = parseCurrency(formData.get('amount') as string);
  if (!period) return { error: 'Período inválido' };
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: 'Não autorizado' };
  const household = await getOrCreateHouseholdForUser(session.user.id);
  await prisma.cashBalance.upsert({
    where: { householdId_period: { householdId: household.id, period } },
    create: { householdId: household.id, period, amount, userId: session.user.id },
    update: { amount, userId: session.user.id },
  });
  revalidatePath('/dashboard/orcamento');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getCashBalanceAction(period: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return 0;
  const household = await getOrCreateHouseholdForUser(session.user.id);
  const cb = await prisma.cashBalance.findUnique({ where: { householdId_period: { householdId: household.id, period } } });
  return cb ? Number(cb.amount) : 0;
}
