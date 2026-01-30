import { Request } from "express";
import { User as PrismaUser } from '../../generated/prisma/client'

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