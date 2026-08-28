'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getOrCreateHouseholdForUser } from '@/lib/household';

function parseCurrency(v: string | null) {
  if (!v) return NaN;
  const t = v.trim();
  if (t.includes('R$') || t.includes(',')) {
    const c = t.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
    return parseFloat(c);
  }
  return parseFloat(t);
}

async function getScope() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Não autorizado');
  const h = await getOrCreateHouseholdForUser(session.user.id);
  return { userId: session.user.id, householdId: h.id };
}

export async function addInvestment(formData: FormData) {
  const { userId, householdId } = await getScope();
  const name = (formData.get('name') as string)?.trim();
  const invested = parseCurrency(formData.get('invested') as string);
  const current = parseCurrency(formData.get('current') as string);
  if (!name || isNaN(invested) || isNaN(current)) return;
  await prisma.investment.create({ data: { name, invested, current, userId, householdId } });
  revalidatePath('/dashboard/investimentos');
  revalidatePath('/dashboard');
}

export async function updateInvestment(formData: FormData) {
  const id = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  const invested = parseCurrency(formData.get('invested') as string);
  const current = parseCurrency(formData.get('current') as string);
  if (!id || !name || isNaN(invested) || isNaN(current)) return;
  await prisma.investment.update({ where: { id }, data: { name, invested, current } });
  revalidatePath('/dashboard/investimentos');
  revalidatePath('/dashboard');
}

export async function deleteInvestment(id: string) {
  await prisma.investment.delete({ where: { id } });
  revalidatePath('/dashboard/investimentos');
  revalidatePath('/dashboard');
}
