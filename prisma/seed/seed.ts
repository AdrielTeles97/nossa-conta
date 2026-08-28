import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Usuarios iniciais deve ser criados via rota protegida");
}

main()
    .catch((e) => {
        console.log(e);
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })