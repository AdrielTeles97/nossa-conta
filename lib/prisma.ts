import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Evita múltiplas instâncias do Prisma no Hot Reload do Next.js
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const hasHousehold = (globalForPrisma.prisma as unknown as { household?: unknown })?.household !== undefined;
const hasCategory = (globalForPrisma.prisma as unknown as { category?: unknown })?.category !== undefined;
const hasCash = (globalForPrisma.prisma as unknown as { cashBalance?: unknown })?.cashBalance !== undefined;
const hasDebtPayment = (globalForPrisma.prisma as unknown as { debtPayment?: unknown })?.debtPayment !== undefined;
export const prisma =
  globalForPrisma.prisma && hasHousehold && hasCategory && hasCash && hasDebtPayment ? globalForPrisma.prisma : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}