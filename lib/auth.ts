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
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
});