import type { Request, Response } from "express";
import { generateAccessToken, verifyToken } from "../utils/helpers.js";
import prisma from "../../lib/prisma.js";

export async function serverHealth(request: Request, response: Response) {
	return response.status(200).json({ status : 'OK' });
};

export async function refreshTokens(request: Request, response: Response) {
	const refreshToken = request.cookies?.refresh_token;
	console.log("Inside refreshTokens: token:", refreshToken);

	if (!refreshToken) {
		return response.status(401).json({
			success: false,
			message: "Access denied. Token missing."
		});
	}

	try {
		// Verifier la validiter du token
		const decoded = verifyToken(refreshToken, true);
		console.log("decoded:", decoded);

		if (!decoded) {
			return response.status(403).json({
				success: false,
				message: "Invalid refresh token"
			});
		}

		// Verifier qu'il correspond a celui en base
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId }
		});
		console.log("user:", user);

		if (!user || user.refreshToken !== refreshToken) {
			return response.status(403).json({
				success: false,
				message: "Refresh token revoked"
			});
		}

		// Generer un NOUVEL access token
		const newAccessToken = generateAccessToken(user.id);
		console.log("newAccessToken:", newAccessToken);

		// Renvoyer le nouveau token
		response.cookie("access_token", newAccessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 15 * 60 * 1000
		});

		return response.status(200).json({
			success: true,
			accessToken: newAccessToken
		});

	} catch (error) {
		console.error("Refresh error:", error);
		return response.status(500).json({
			success: false,
			message: "Server error"
		});
	}
}