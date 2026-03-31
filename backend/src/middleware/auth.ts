import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/helpers.js";
import prisma from "../lib/prisma.js";

export const authenticateToken = async (request: Request, response: Response, next: NextFunction) => {
	// Chercher le token dans les cookies ou le header
	const token = request.cookies?.access_token;
	console.log("Inside authenticateToken: token:", token);

	if (!token) {
		return response.status(401).json({
			success: false,
			message: "backend.auth.token.missing"
		});
	}

	// verifier le token
	const decoded = verifyToken(token);
	console.log("decoded:", decoded);

	if (!decoded) {
		return response.status(403).json({
			success: false,
			message: "backend.auth.token.invalid.or.expired"
		});
	}

	// ajouter l'ID de l'utilisateur a la requete
	try {
		const user = await prisma.user.findFirst({
			where : { id: decoded.userId },
			include: {
				matchWins: { select: { id: true, winnerId: true, loserId: true } },
				matchLosses: { select: { id: true, winnerId: true,  loserId: true } }
			}
		})
		console.log("user:", user);

		if (!user) {
			return response.status(404).json({
				success: false,
				message: "backend.auth.user.not.found"
			});
		}
		request.user = user;
	} catch (error) {
		console.error("Login error:", error);
		return response.status(500).json({
			success: false,
			message: "backend.auth.server.error"
		});
	}
	next();
};