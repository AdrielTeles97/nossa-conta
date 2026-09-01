import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const incomeId = searchParams.get("incomeId");
  if (!incomeId) return Response.json([]);
  const allocs = await prisma.incomeAllocation.findMany({ where: { incomeId } });
  return Response.json(allocs);
}
