import dotenv from 'dotenv';
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

dotenv.config();

const globalForPrisma = global as unknown as {
	prisma:	PrismaClient
}

const adapter = new PrismaMariaDb({
	host: process.env.DATABASE_HOST || "db",
	user: process.env.DATABASE_USER || "root",
	password: process.env.DATABASE_PASSWORD || "root",
	database: process.env.DATABASE_NAME || "mydb",
	connectionLimit: 5
})

const	prisma = globalForPrisma.prisma || new PrismaClient({
	adapter,
})

if (process.env["NODE_ENV"] !== 'production') globalForPrisma.prisma = prisma

export default prisma