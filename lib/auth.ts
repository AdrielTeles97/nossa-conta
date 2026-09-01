import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Cria a configuração de conexão puxando do seu .env
const connectionString = process.env.DATABASE_URL;

// 2. Inicia o Pool de conexão do Postgres
const pool = new Pool({ connectionString });

// 3. Passa o Pool para o adaptador do Prisma
const adapter = new PrismaPg(pool);

// 4. Inicia o Prisma usando o adaptador
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    trustedOrigins: [
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      "https://nossa-conta-self.vercel.app",
      "https://nossa-conta.vercel.app",
    ].filter(Boolean) as string[],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
          console.log(`[Nossa Conta] Reset para ${user.email}: ${url}`);
        },
        resetPasswordTokenExpiresIn: 3600,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 dias quando lembrar
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
    advanced: {
      crossSubDomainCookies: { enabled: true },
    },
});