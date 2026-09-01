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
    const payDay = parseInt(formData.get('payDay') as string) || null;

    if (!name || isNaN(value)) return;

    const data: any = { name, value, category, isRecurring, payDay, userId: user.id, householdId };
    if (dateStr) {
      const d = parseLocalDate(dateStr);
      if (!isNaN(d.getTime())) data.createdAt = d;
    }

    const income = await prisma.income.create({ data });

    // vincula despesas fixas e variáveis selecionadas
    for (const [key, val] of formData.entries()) {
      if (key.startsWith('alloc_fixed_')) {
        const fixedId = key.replace('alloc_fixed_', '');
        const amount = parseCurrency(val as string);
        if (!isNaN(amount) && amount > 0) {
          await prisma.incomeAllocation.create({ data: { householdId, incomeId: income.id, fixedExpenseId: fixedId, amount } });
        }
      } else if (key.startsWith('alloc_var_')) {
        const varId = key.replace('alloc_var_', '');
        const amount = parseCurrency(val as string);
        if (!isNaN(amount) && amount > 0) {
          await prisma.incomeAllocation.create({ data: { householdId, incomeId: income.id, variableExpenseId: varId, amount } });
        }
      } else if (key.startsWith('alloc_')) {
        // compatibilidade antigo (só fixas)
        const fixedId = key.replace('alloc_', '');
        const amount = parseCurrency(val as string);
        if (!isNaN(amount) && amount > 0) {
          // tenta como fixed, se falhar ignora
          try { await prisma.incomeAllocation.create({ data: { householdId, incomeId: income.id, fixedExpenseId: fixedId, amount } }); } catch {}
        }
      }
    }

    revalidateBudgetPaths();
}

export async function updateIncome(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const value = parseCurrency(formData.get('value') as string);
    const category = (formData.get('category') as string) || 'Geral';
    const dateStr = formData.get('date') as string | null;
    const isRecurring = formData.get('isRecurring') === 'on' || formData.get('isRecurring') === 'true';
    const payDay = parseInt(formData.get('payDay') as string) || null;
    if (!id || !name || isNaN(value)) return;
    const data: any = { name, value, category, isRecurring, payDay };
    if (dateStr) {
      const d = parseLocalDate(dateStr);
      if (!isNaN(d.getTime())) data.createdAt = d;
    }
    await prisma.income.update({ where: { id }, data });
    // atualiza alocações: apaga antigas e recria (fixas e variáveis)
    await prisma.incomeAllocation.deleteMany({ where: { incomeId: id } });
    for (const [key, val] of formData.entries()) {
      if (key.startsWith('alloc_fixed_')) {
        const fixedId = key.replace('alloc_fixed_', '');
        const amount = parseCurrency(val as string);
        if (!isNaN(amount) && amount > 0) {
          const household = await prisma.income.findUnique({ where: { id }, select: { householdId: true } });
          await prisma.incomeAllocation.create({ data: { householdId: household?.householdId!, incomeId: id, fixedExpenseId: fixedId, amount } });
        }
      } else if (key.startsWith('alloc_var_')) {
        const varId = key.replace('alloc_var_', '');
        const amount = parseCurrency(val as string);
        if (!isNaN(amount) && amount > 0) {
          const household = await prisma.income.findUnique({ where: { id }, select: { householdId: true } });
          await prisma.incomeAllocation.create({ data: { householdId: household?.householdId!, incomeId: id, variableExpenseId: varId, amount } });
        }
      } else if (key.startsWith('alloc_')) {
        const fixedId = key.replace('alloc_', '');
        const amount = parseCurrency(val as string);
        if (!isNaN(amount) && amount > 0) {
          const household = await prisma.income.findUnique({ where: { id }, select: { householdId: true } });
          try { await prisma.incomeAllocation.create({ data: { householdId: household?.householdId!, incomeId: id, fixedExpenseId: fixedId, amount } }); } catch {}
        }
      }
    }
    revalidateBudgetPaths();
}

export async function deleteIncome(id: string) {
    await prisma.income.delete({ where: { id } });
    revalidateBudgetPaths();
}

// --- CRUD DESPESAS VARIÁVEIS ---

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

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
            date: parseLocalDate(dateStr),
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
      const d = parseLocalDate(dateStr);
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

export async function toggleFixedExpense(formData: FormData) {
  const id = formData.get("id") as string;
  const period = (formData.get("period") as string) || new Date().toISOString().slice(0, 7);
  const fixed = await prisma.fixedExpense.findUnique({ where: { id } });
  if (!fixed) return;

  // Se vinculada a dívida (parcela), controla via DebtPayment por competência
  if (fixed.linkedDebtId) {
    const debt = await prisma.debt.findUnique({ where: { id: fixed.linkedDebtId } });
    if (!debt) {
      await prisma.fixedExpense.update({ where: { id }, data: { paid: !fixed.paid } });
      revalidateBudgetPaths();
      return;
    }
    const session = await auth.api.getSession({ headers: await headers() });
    const householdId = fixed.householdId || (session ? (await getOrCreateHouseholdForUser(session.user.id)).id : null);
    const userId = fixed.userId;
    const existing = await prisma.debtPayment.findUnique({ where: { debtId_competence: { debtId: debt.id, competence: period } } }).catch(() => null);

    if (existing) {
      // desmarcar: remove pagamento e estorna saldo
      await prisma.$transaction([
        prisma.debt.update({ where: { id: debt.id }, data: { balance: Number(debt.balance) + Number(existing.amount), paidInstallments: { decrement: 1 } } }),
        prisma.debtPayment.delete({ where: { id: existing.id } }),
        prisma.fixedExpense.update({ where: { id }, data: { paid: false } }),
      ]);
    } else {
      // marcar como pago: cria pagamento e debita
      const amount = Number(fixed.value);
      const newBal = Math.max(0, Number(debt.balance) - amount);
      await prisma.$transaction([
        prisma.debt.update({ where: { id: debt.id }, data: { balance: newBal, paidInstallments: { increment: 1 } } }),
        prisma.debtPayment.create({ data: { debtId: debt.id, householdId: householdId!, userId, competence: period, amount, paidAt: new Date() } }),
        prisma.fixedExpense.update({ where: { id }, data: { paid: true } }),
      ]);
    }
  } else {
    await prisma.fixedExpense.update({ where: { id }, data: { paid: !fixed.paid } });
  }
  revalidateBudgetPaths();
  revalidatePath(`/dashboard/patrimonio`);
}
