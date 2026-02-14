import type { NextFunction, Request, response, Response } from "express";
import { verifyToken } from "../utils/helpers.js";
import prisma from "../lib/prisma.js";

export const authenticateToken = async (request: Request, response: Response, next: NextFunction) => {
	// Chercher le token dans les cookies ou le header
	const token = request.cookies?.access_token;
	console.log("Inside authenticateToken: token:", token);

	if (!token) {
		return response.status(401).json({
			success: false,
			message: "Access denied. Token missing."
		});
	}

	// verifier le token
	const decoded = verifyToken(token);
	console.log("decoded:", decoded);

	if (!decoded) {
		return response.status(403).json({
			success: false,
			message: "Invalid or expired token."
		});
	}

	// ajouter l'ID de l'utilisateur a la requete
	try {
		const user = await prisma.user.findFirst({
			where : { id: decoded.userId }
		})
		console.log("user:", user);

		if (!user) {
			return response.status(401).json({
				success: false,
				message: "User not found"
			});
		}
		
		request.user = user;
	} catch (error) {
		console.error("Login error:", error);
		return response.status(500).json({
			success: false,
			message: "Server error during authentification"
		});	
	}
	next();
};