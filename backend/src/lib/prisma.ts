import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = global as unknown as {
	prisma:	PrismaClient
}

const adapter = new PrismaMariaDb({
	host: process.env.DATABASE_HOST || "localhost",
	user: process.env.DATABASE_USER || "root",
	password: process.env.DATABASE_PASSWORD || "",
	database: process.env.DATABASE_NAME || "transcendence",
	connectionLimit: 5
})

const	prisma = globalForPrisma.prisma || new PrismaClient({
	adapter,
})

if (process.env["NODE_ENV"] !== 'production') globalForPrisma.prisma = prisma

export default prisma
