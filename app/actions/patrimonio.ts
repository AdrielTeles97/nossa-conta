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

export async function addAsset(formData: FormData) {
  const { userId, householdId } = await getScope();
  const name = (formData.get('name') as string)?.trim();
  const category = (formData.get('category') as string) || 'Outros';
  const value = parseCurrency(formData.get('value') as string);
  const down = parseCurrency(formData.get('downPayment') as string) || 0;
  const installments = parseInt((formData.get('installments') as string) || '0');
  const paidInstallments = parseInt((formData.get('paidInstallments') as string) || '0');
  const dueDay = parseInt((formData.get('dueDay') as string) || '10');
  const balanceOverride = parseCurrency(formData.get('balance') as string);
  if (!name || isNaN(value)) return;
  const asset = await prisma.asset.create({ data: { name, category, value, userId, householdId } });
  const financed = value - down;
  if (financed > 0 && installments > 0) {
    const installment = financed / installments;
    const balance = !isNaN(balanceOverride) && balanceOverride > 0 ? balanceOverride : Math.max(0, financed - paidInstallments * installment);
    const debt = await prisma.debt.create({
      data: {
        name: `Financiamento ${name}`,
        category: 'Financiamento',
        balance,
        installment,
        totalInstallments: installments,
        paidInstallments,
        dueDay,
        assetId: asset.id,
        userId,
        householdId,
      },
    });
    await prisma.fixedExpense.create({
      data: { name: `Parcela ${name}`, category: 'Dívidas', value: installment, dueDay, linkedDebtId: debt.id, userId, householdId },
    });
  }
  revalidatePath('/dashboard/patrimonio');
  revalidatePath('/dashboard');
}

export async function updateAsset(formData: FormData) {
  const id = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  const category = (formData.get('category') as string) || 'Outros';
  const value = parseCurrency(formData.get('value') as string);
  if (!id || !name || isNaN(value)) return;
  await prisma.asset.update({ where: { id }, data: { name, category, value } });
  revalidatePath('/dashboard/patrimonio');
}

export async function deleteAsset(id: string) {
  await prisma.asset.delete({ where: { id } });
  revalidatePath('/dashboard/patrimonio');
}

export async function addDebt(formData: FormData) {
  const { userId, householdId } = await getScope();
  const name = (formData.get('name') as string)?.trim();
  const balance = parseCurrency(formData.get('value') as string) || parseCurrency(formData.get('balance') as string);
  const dueDay = parseInt((formData.get('dueDay') as string) || '10');
  const installments = parseInt((formData.get('installments') as string) || (formData.get('totalInstallments') as string) || '1');
  const paidInstallments = parseInt((formData.get('paidInstallments') as string) || '0');
  const installmentRaw = parseCurrency(formData.get('installment') as string);
  const assetId = (formData.get('assetId') as string) || null;
  if (!name || isNaN(balance)) return;
  let installment = !isNaN(installmentRaw) ? installmentRaw : installments > 0 ? balance / Math.max(1, installments - paidInstallments) : balance;
  // se usuário informou total e já pagas, recalcula se não informou parcela
  if (isNaN(installmentRaw) && installments > 0 && paidInstallments > 0) {
    // tenta inferir parcela original se saldo é restante: não temos original, mantém balance/(total-paid) como fallback já feito
  }
  const debt = await prisma.debt.create({
    data: {
      name,
      category: 'Dívida',
      balance,
      installment,
      totalInstallments: installments,
      paidInstallments,
      dueDay,
      assetId: assetId || undefined,
      userId,
      householdId,
    },
  });
  if (installments > 0) {
    await prisma.fixedExpense.create({
      data: { name: `Parcela ${name}`, category: 'Dívidas', value: installment, dueDay, linkedDebtId: debt.id, userId, householdId },
    });
  }
  revalidatePath('/dashboard/patrimonio');
  revalidatePath('/dashboard/orcamento');
}

export async function updateDebt(formData: FormData) {
  const id = formData.get('id') as string;
  const balance = parseCurrency(formData.get('balance') as string);
  const installment = parseCurrency(formData.get('installment') as string);
  const totalInstallments = parseInt((formData.get('totalInstallments') as string) || '0');
  const paidInstallments = parseInt((formData.get('paidInstallments') as string) || '0');
  const dueDay = parseInt((formData.get('dueDay') as string) || '10');
  if (!id || isNaN(balance) || isNaN(installment)) return;
  await prisma.debt.update({ where: { id }, data: { balance, installment, totalInstallments, paidInstallments, dueDay } });
  // atualiza fixedExpense vinculado
  await prisma.fixedExpense.updateMany({ where: { linkedDebtId: id }, data: { value: installment, dueDay } });
  revalidatePath('/dashboard/patrimonio');
  revalidatePath('/dashboard/orcamento');
}

export async function deleteDebt(id: string) {
  await prisma.debt.delete({ where: { id } });
  // also delete linked fixedExpenses
  await prisma.fixedExpense.deleteMany({ where: { linkedDebtId: id } });
  revalidatePath('/dashboard/patrimonio');
  revalidatePath('/dashboard/orcamento');
}

export async function payDebtInstallment(debtId: string) {
  const debt = await prisma.debt.findUnique({ where: { id: debtId } });
  if (!debt) return;
  const newBal = Number(debt.balance) - Number(debt.installment);
  const newPaid = (debt as any).paidInstallments + 1;
  await prisma.debt.update({
    where: { id: debtId },
    data: { balance: newBal < 0 ? 0 : newBal, paidInstallments: newPaid, totalInstallments: (debt as any).totalInstallments || 0 },
  });
  revalidatePath('/dashboard/patrimonio');
  revalidatePath('/dashboard');
}
