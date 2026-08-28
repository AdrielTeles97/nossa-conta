'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getOrCreateHouseholdForUser } from '@/lib/household';

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Não autorizado');
  return session.user;
}

export async function getHouseholdInfo() {
  const user = await getUser();
  const household = await getOrCreateHouseholdForUser(user.id);
  const members = await prisma.user.findMany({
    where: { householdId: household.id },
    select: { id: true, name: true, email: true },
  });
  return { household, members, currentUserId: user.id };
}

export async function joinHousehold(formData: FormData) {
  const code = (formData.get('inviteCode') as string)?.trim();
  if (!code) return { error: 'Código inválido' };
  const sessionUser = await getUser();
  const dbUser = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { householdId: true } });
  const household = await prisma.household.findUnique({ where: { inviteCode: code } });
  if (!household) return { error: 'Código não encontrado' };
  if (dbUser?.householdId === household.id) return { error: 'Você já faz parte deste household' };

  // Remove user from old household? Keep, just reassign
  // If old household becomes empty, delete it
  const oldHouseholdId = dbUser?.householdId;

  await prisma.user.update({ where: { id: sessionUser.id }, data: { householdId: household.id } });

  // migrate existing personal records to new household
  await Promise.all([
    prisma.income.updateMany({ where: { userId: sessionUser.id, householdId: oldHouseholdId }, data: { householdId: household.id } }),
    prisma.variableExpense.updateMany({ where: { userId: sessionUser.id, householdId: oldHouseholdId }, data: { householdId: household.id } }),
    prisma.fixedExpense.updateMany({ where: { userId: sessionUser.id, householdId: oldHouseholdId }, data: { householdId: household.id } }),
  ]);

  // cleanup old household if empty
  if (oldHouseholdId) {
    const remaining = await prisma.user.count({ where: { householdId: oldHouseholdId } });
    if (remaining === 0) await prisma.household.delete({ where: { id: oldHouseholdId } }).catch(() => {});
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/orcamento');
  return { success: true };
}

export async function inviteByEmail(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  if (!email) return { error: 'Email inválido' };
  const user = await getUser();
  const household = await getOrCreateHouseholdForUser(user.id);
  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) return { error: 'Usuário não encontrado. Ele precisa se cadastrar primeiro.' };
  if (target.householdId === household.id) return { error: 'Usuário já faz parte da sua família' };

  const oldHouseholdId = target.householdId;
  await prisma.user.update({ where: { id: target.id }, data: { householdId: household.id } });
  await Promise.all([
    prisma.income.updateMany({ where: { userId: target.id, householdId: oldHouseholdId }, data: { householdId: household.id } }),
    prisma.variableExpense.updateMany({ where: { userId: target.id, householdId: oldHouseholdId }, data: { householdId: household.id } }),
    prisma.fixedExpense.updateMany({ where: { userId: target.id, householdId: oldHouseholdId }, data: { householdId: household.id } }),
  ]);
  if (oldHouseholdId) {
    const remaining = await prisma.user.count({ where: { householdId: oldHouseholdId } });
    if (remaining === 0) await prisma.household.delete({ where: { id: oldHouseholdId } }).catch(() => {});
  }
  revalidatePath('/dashboard');
  return { success: true };
}

export async function leaveHousehold() {
  const sessionUser = await getUser();
  const current = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { householdId: true } });
  if (!current?.householdId) return;
  const oldId = current.householdId;
  const newHousehold = await prisma.household.create({ data: { name: sessionUser.name ? `Família ${sessionUser.name}` : 'Meu Household' } });
  await prisma.user.update({ where: { id: sessionUser.id }, data: { householdId: newHousehold.id } });
  // Keep records? For simplicity, leave records in old household (shared). New household starts empty.
  const remaining = await prisma.user.count({ where: { householdId: oldId } });
  if (remaining === 0) await prisma.household.delete({ where: { id: oldId } }).catch(() => {});
  revalidatePath('/dashboard');
}

export async function updateHouseholdName(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  if (!name) return;
  const user = await getUser();
  const household = await getOrCreateHouseholdForUser(user.id);
  await prisma.household.update({ where: { id: household.id }, data: { name } });
  revalidatePath('/dashboard');
}
