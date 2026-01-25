import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = global as unknown as {
	prisma:	PrismaClient
}

const adapter = new PrismaPg({
	connectionString:	process.env["DATABASE_URL"] || "postgresql://Aimrad:test@localhost:5432/ma_db?schema=public",
})

const	prisma = globalForPrisma.prisma || new PrismaClient({
	adapter,
})

if (process.env["NODE_ENV"] !== 'production') globalForPrisma.prisma = prisma

export default prisma