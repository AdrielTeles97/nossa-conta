'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getOrCreateHouseholdForUser, getHouseholdIdForUser } from '@/lib/household';

function parseCurrency(value: string | null): number {
  if (!value) return NaN;
  // Suporta tanto "1234.56" quanto "R$ 1.234,56"
  const trimmed = value.trim();
  if (trimmed.includes("R$") || trimmed.includes(",")) {
    const cleaned = trimmed.replace(/\s/g, "").replace("R$", "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? NaN : n;
  }
  const n = parseFloat(trimmed);
  return isNaN(n) ? NaN : n;
}

function revalidateBudgetPaths() {
  revalidatePath('/dashboard/orcamento');
  revalidatePath('/dashboard');
}

// Função utilitária para pegar o usuário logado
async function getUser() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) throw new Error('Não autorizado');
    return session.user;
}

async function getHouseholdScope() {
  const user = await getUser();
  const household = await getOrCreateHouseholdForUser(user.id);
  return { user, householdId: household.id };
}

// --- CRUD RECEITAS ---

export async function addIncome(formData: FormData) {
    const { user, householdId } = await getHouseholdScope();
    const name = formData.get('name') as string;
    const value = parseCurrency(formData.get('value') as string);
    const dateStr = formData.get('date') as string | null;
    const category = (formData.get('category') as string) || 'Geral';
    const isRecurring = formData.get('isRecurring') === 'on' || formData.get('isRecurring') === 'true';

    if (!name || isNaN(value)) return;

    const data: any = { name, value, category, isRecurring, userId: user.id, householdId };
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) data.createdAt = d;
    }

    await prisma.income.create({ data });

    revalidateBudgetPaths();
}

export async function updateIncome(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const value = parseCurrency(formData.get('value') as string);
    const category = (formData.get('category') as string) || 'Geral';
    const dateStr = formData.get('date') as string | null;
    const isRecurring = formData.get('isRecurring') === 'on' || formData.get('isRecurring') === 'true';
    if (!id || !name || isNaN(value)) return;
    const data: any = { name, value, category, isRecurring };
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) data.createdAt = d;
    }
    await prisma.income.update({ where: { id }, data });
    revalidateBudgetPaths();
}

export async function deleteIncome(id: string) {
    await prisma.income.delete({ where: { id } });
    revalidateBudgetPaths();
}

// --- CRUD DESPESAS VARIÁVEIS ---

export async function addVariableExpense(formData: FormData) {
    const { user, householdId } = await getHouseholdScope();
    const name = formData.get('name') as string;
    const value = parseCurrency(formData.get('value') as string);
    const category = formData.get('category') as string;
    const dateStr = formData.get('date') as string;

    if (!name || isNaN(value) || !category || !dateStr) return;

    await prisma.variableExpense.create({
        data: {
            name,
            value,
            category,
            date: new Date(dateStr),
            userId: user.id,
            householdId,
        },
    });

    revalidateBudgetPaths();
}

export async function updateVariableExpense(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const value = parseCurrency(formData.get('value') as string);
    const category = formData.get('category') as string;
    const dateStr = formData.get('date') as string;
    if (!id || !name || isNaN(value) || !category) return;
    const data: any = { name, value, category };
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) data.date = d;
    }
    await prisma.variableExpense.update({ where: { id }, data });
    revalidateBudgetPaths();
}

export async function deleteVariableExpense(id: string) {
    await prisma.variableExpense.delete({ where: { id } });
    revalidateBudgetPaths();
}

export async function updateInvestPlan(pct: number) {
  const user = await getUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { investmentTargetPct: pct }
  });
  revalidateBudgetPaths();
}

export async function addFixedExpense(formData: FormData) {
  const { user, householdId } = await getHouseholdScope();
  const name = formData.get("name") as string;
  const value = parseCurrency(formData.get("value") as string);
  const category = formData.get("category") as string;
  const dueDay = parseInt(formData.get("dueDay") as string);
  const period = (formData.get("period") as string) || null;
  const isRecurring = formData.get("isRecurring") === "on" || formData.get("isRecurring") === "true";

  if (!name || isNaN(value) || !category || isNaN(dueDay)) return;

  await prisma.fixedExpense.create({
    data: { name, value, category, dueDay, period: isRecurring ? null : period, isRecurring, userId: user.id, householdId }
  });

  revalidateBudgetPaths();
}

export async function updateFixedExpense(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const value = parseCurrency(formData.get('value') as string);
  const category = formData.get('category') as string;
  const dueDay = parseInt(formData.get('dueDay') as string);
  const period = (formData.get("period") as string) || null;
  const isRecurring = formData.get("isRecurring") === "on" || formData.get("isRecurring") === "true";
  if (!id || !name || isNaN(value) || !category || isNaN(dueDay)) return;
  await prisma.fixedExpense.update({ where: { id }, data: { name, value, category, dueDay, period: isRecurring ? null : period, isRecurring } });
  revalidateBudgetPaths();
}

export async function deleteFixedExpense(id: string) {
  await prisma.fixedExpense.delete({ where: { id } });
  revalidateBudgetPaths();
}

export async function toggleFixedExpense(id: string, currentStatus: boolean) {
  await prisma.fixedExpense.update({
    where: { id },
    data: { paid: !currentStatus }
  });
  revalidateBudgetPaths();
}
