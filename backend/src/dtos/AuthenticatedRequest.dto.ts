import type { Request } from "express";
import type { User as PrismaUser } from '../../generated/prisma/client.js'

export interface AuthentificatedRequest extends Request {
	userId? : string;
}

declare global {
	namespace Express {
		interface User extends PrismaUser {}
		
		interface request {
			user?: User;
		}
	}
}

export {};