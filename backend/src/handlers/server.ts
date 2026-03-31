import type { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/helpers.js";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandlers.js";

export const serverHealth = asyncHandler(async (request: Request, response: Response) => {
	return response.status(200).json({ status : 'OK' });
});

export const refreshTokens = asyncHandler(async (request: Request, response: Response) => {
	const refreshToken = request.cookies?.refresh_token;
	console.log("Inside refreshTokens: token:", refreshToken);

	if (!refreshToken) {
		return response.status(401).json({
			success: false,
			message: "backend.auth.token.missing"
		});
	}

	// Verifier la validiter du token
	const decoded = verifyToken(refreshToken, true);
	console.log("decoded:", decoded);

	if (!decoded) {
		return response.status(403).json({
			success: false,
			message: "backend.auth.refresh.token.invalid"
		});
	}

	// Verifier qu'il correspond a celui en base
	const user = await prisma.user.findUnique({
		where: { id: decoded.userId }
	});
	console.log("user:", user);

	if (!user) {
		return response.status(404).json({
			success: false,
			message: "backend.auth.user.not.found"
		});
	}

	if (user.refreshToken !== refreshToken) {
		await prisma.user.update({
			where : { id: user.id },
			data : { isOnline: false }
		});
		return response.status(403).json({
			success: false,
			message: "backend.auth.refresh.token.revoked"
		});
	}

	// Generer un NOUVEL access token et refresh token
	const newAccessToken = generateAccessToken(user.id);
	console.log("newAccessToken:", newAccessToken);

	const newRefreshToken = generateRefreshToken(user.id);
	console.log("newAccessToken:", newAccessToken);

	await prisma.user.update({
		where : { id: user.id },
		data: { refreshToken: newRefreshToken }
	})

	// Renvoyer le nouveau token
	const isSecure = process.env.NODE_ENV === "production" || process.env.FRONTEND_URL?.startsWith("https");

	response.cookie("access_token", newAccessToken, {
		httpOnly: true,
		secure: isSecure,
		sameSite: "lax",
		maxAge: 15 * 60 * 1000
	});

	response.cookie("refresh_token",newRefreshToken, {
		httpOnly: true,
		secure: isSecure,
		sameSite: "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000
	});

	return response.status(200).json({
		success: true,
		accessToken: newAccessToken,
		refreshToken: newRefreshToken
	});
});