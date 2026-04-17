import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { matchedData, validationResult } from "express-validator";
import { comparePassword, generateAccessToken, generateRefreshToken, getAllFriendIds, hashPassword } from "../utils/helpers.js";
import type { CreateUserDto } from "../dtos/CreateUser.dto.js";
import { getIO } from "../lib/socket.js";
import { asyncHandler } from "../utils/asyncHandlers.js";

export const registerUsers = asyncHandler(async (request: Request, response: Response) => {
	const result = validationResult(request);

	if (!result.isEmpty()) {
		return response.status(400).json({
			success: false,
			errors: result.array()
		});
	}
	const data = matchedData(request) as CreateUserDto;

	// Verifier si l'utilisateur existe deja
	const existingUser = await prisma.user.findFirst({
		where: {
			OR : [
				{ email: data.email },
				{ username: data.username }
			]
		}
	});

	if (existingUser) {
		return response.status(409).json({
			success: false,
			message: "backend.auth.duplicate.user"
		});
	}

	// Hasher le mot de passe
	data.password = hashPassword(data.password);

	// Creer l'utilsateur
	const newUser = await prisma.user.create({
		data: {
			email: data.email,
			password: data.password,
			username: data.username,
		},
		select: {
			id: true,
			email: true,
			username: true,
			createdAt: true,
		}
	});

	return response.status(201).json({
		success: true,
		user: newUser,
	});
});

export const loginUser = asyncHandler(async (request: Request, response: Response) => {
	const result = validationResult(request);

	if (!result.isEmpty()) {
		return response.status(400).json({
			success: false,
			errors: result.array()
		});
	}

	const { email, password } = matchedData(request) as { email: string, password: string};

	// chercher l'utilisateur
	let user = await prisma.user.findUnique({
		where: { email: email },
	});

	// if (user?.isOnline) {
	// 	// console.log("[login] User already online, allowing re-login :", user.isOnline);
	// 	// Allow re-login even if already online - will be handled by socket disconnect
	// 	return response.status(409).json({
	// 		success: true,
	// 		message: "already logged in"
	// 	});
	// }

	if (!user || !user.password) {
		return response.status(401).json({
			success: false,
			message: "backend.auth.invalid.credentials"
		});
	}

	const isPasswordValid = comparePassword(password, user.password);

	if (!isPasswordValid) {
		return response.status(401).json({
			success: false,
			message: "backend.auth.invalid.credentials"
		});
	}

	// Configurer les cookies
	const isSecure = process.env.NODE_ENV === "production" || process.env.FRONTEND_URL?.startsWith("https");
	console.log(`[login] Setting cookies: isSecure=${isSecure}, NODE_ENV=${process.env.NODE_ENV}, FRONTEND_URL=${process.env.FRONTEND_URL}`);

	// Generer les tokens
	const accessToken = generateAccessToken(user.id);
	let refreshToken;
	if (user.isOnline === false) {
		refreshToken = generateRefreshToken(user.id);
		// Mettre a jour le refresh token en base
		user = await prisma.user.update({
			where : { id : user.id },
			data: {
				isOnline: true,
				refreshToken : refreshToken
			}
		});
		console.log('user.refreshToken:', user.refreshToken)
	}

	response.cookie("access_token", accessToken, {
		httpOnly: true,
		secure: isSecure,
		sameSite: "lax",
		maxAge: 15 * 60 * 1000
	})
	console.log("[login] access_token cookie set");

	response.cookie("refresh_token", user.refreshToken, {
		httpOnly: true,
		secure: isSecure,
		sameSite: "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000
	});
	console.log("[login] refresh_token cookie set");

	// Reponse sans le mot de passe
	const userWithoutPassword = {
		id: user.id,
		email: user.email,
		username: user.username,
		role: user.role,
		createdAt: user.createdAt,
	};

	return response.status(200).json({
		success: true,
		user: userWithoutPassword,
		accessToken: accessToken
	});
});

export const logoutUser = asyncHandler(async (request: Request, response: Response) => {
	const io = getIO();
	const user = request.user!;

	const friendsIds = await getAllFriendIds(user.id);
	const sockets = await io.in(`user:${user.id}`).fetchSockets();

	if (sockets.length === 1) {
		await prisma.user.update({
			where : { id: user.id },
			data: {
				refreshToken: null,
				isOnline: false,
			},
		});
		friendsIds.forEach(friendsId => {
			io.to(`user:${friendsId}`).emit('friend:status_changed', {
				userId: user.id,
				isOnline: false,
			});
		});
	}

	const isSecure = process.env.NODE_ENV === "production" || process.env.FRONTEND_URL?.startsWith("https");

	response.clearCookie('access_token', {
		httpOnly: true,
		secure: isSecure,
		sameSite: "lax",
	});

	response.clearCookie('refresh_token', {
		httpOnly: true,
		secure: isSecure,
		sameSite: "lax",
	});

	return response.status(200).json({
		success: true,
		message: 'backend.auth.logout.success',
	});
});

export const authHandler = asyncHandler(async (request: Request, response: Response) => {
	// Verification
	// console.log('req.user after passport:', request.user);
	// console.log('Type of req.user:', typeof request.user);
	// console.log('Keys:', request.user ? Object.keys(request.user) : 'null');
	if (!request.user) {
		throw new Error("backend.auth.no.user.after.authentication");
	}

	// Maintenant que TypeScript connais la structure
	const { id, username } = request.user;
	console.log(`User ${username} (${id}) authenticated via 42`);

	// Set cookies et rediriger
	const isSecure = process.env.NODE_ENV === "production" || process.env.FRONTEND_URL?.startsWith("https");

	// Generer les tokens
	const accessToken = generateAccessToken(id);
	let refreshToken;
	if (request.user.isOnline === false) {
		refreshToken = generateRefreshToken(id);
		// Mettre a jour le refresh token en base
		request.user = await prisma.user.update({
			where : { id : id },
			data: {
				isOnline: true,
				refreshToken : refreshToken
			}
		});
	}

	response.cookie("access_token", accessToken, {
		httpOnly: true,
		secure: isSecure,
		sameSite: "lax",
		maxAge: 15 * 60 * 1000
	})

	response.cookie("refresh_token", request.user.refreshToken, {
		httpOnly: true,
		secure: isSecure,
		sameSite: "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000
	});

	// redirection frontend
	return response.redirect("https://localhost:1443/");
});

/**
 * Endpoint pour récupérer le token d'accès actuel.
 * Utilisé par Socket.io pour passer le token dans socket.handshake.auth
 * au lieu de dépendre des cookies HTTP.
 */
export const getSocketToken = asyncHandler(async (request: Request, response: Response) => {
	const token = request.cookies?.access_token;

	if (!token) {
		return response.status(401).json({
			success: false,
			message: "backend.auth.no.valid.token"
		});
	}

	return response.status(200).json({
		success: true,
		token: token
	});
});