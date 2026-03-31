import type { NextFunction, Request, Response } from "express";
import type { UserRoles } from "../../generated/prisma/client.js";

export const roleGuard = (allowedRoles: UserRoles[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: 'backend.middleware.role.unauthorized'
			});
		}

		if (!allowedRoles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				message: 'backend.middleware.role.forbidden'
			});
		}

		next();
	};
};