'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  if (!name && !email) return { error: 'Nada para atualizar' };
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: 'Não autorizado' };
  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  try {
    await prisma.user.update({ where: { id: session.user.id }, data });
  } catch (e: any) {
    if (e.code === 'P2002') return { error: 'Email já em uso' };
    throw e;
  }
  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  if (!currentPassword || !newPassword) return { error: 'Preencha todos os campos' };
  if (newPassword.length < 6) return { error: 'Nova senha deve ter ao menos 6 caracteres' };
  const h = await headers();
  // better-auth change password via API
  try {
    // @ts-ignore - better-auth api
    await (auth.api as any).changePassword({
      body: { currentPassword, newPassword },
      headers: h,
    });
  } catch (e: any) {
    return { error: e.message || 'Erro ao trocar senha' };
  }
  return { success: true };
}
