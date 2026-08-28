'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getOrCreateHouseholdForUser } from '@/lib/household';

async function getHouseholdScope() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Não autorizado');
  const household = await getOrCreateHouseholdForUser(session.user.id);
  return { userId: session.user.id, householdId: household.id };
}

const DEFAULTS: Record<string, string[]> = {
  income: ['Geral', 'Salário', 'Freelance', 'Investimentos', 'Outros'],
  fixed: ['Geral', 'Moradia', 'Saúde', 'Educação', 'Assinaturas', 'Transporte', 'Outros'],
  variable: ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros'],
  asset: ['Imóvel', 'Veículo', 'Reserva', 'Outros'],
  debt: ['Financiamento', 'Cartão', 'Empréstimo', 'Outros'],
};

export async function getCategories(type: string) {
  const { householdId } = await getHouseholdScope();
  const cats = await prisma.category.findMany({ where: { householdId, type }, orderBy: { name: 'asc' } });
  if (cats.length === 0) {
    // seed defaults lazily
    const defaults = DEFAULTS[type] || DEFAULTS.variable;
    await prisma.category.createMany({
      data: defaults.map((name) => ({ name, type, householdId })),
      skipDuplicates: true,
    });
    return prisma.category.findMany({ where: { householdId, type }, orderBy: { name: 'asc' } });
  }
  return cats;
}

export async function createCategory(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const type = (formData.get('type') as string) || 'variable';
  if (!name) return { error: 'Nome obrigatório' };
  const { householdId, userId } = await getHouseholdScope();
  try {
    await prisma.category.create({ data: { name, type, householdId, userId } });
  } catch (e: any) {
    if (e.code === 'P2002') return { error: 'Categoria já existe' };
    throw e;
  }
  revalidatePath('/dashboard/orcamento');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath('/dashboard/orcamento');
  return { success: true };
}
