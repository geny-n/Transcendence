import type { Request, Response } from "express";
import prisma from "../../lib/prisma";
import { matchedData, validationResult } from "express-validator";
import { comparePassword, generateAccessToken, generateRefreshToken, hashPassword } from "../utils/helpers";
import { CreateUserDto } from "../dtos/CreateUser.dto";
import { AuthentificatedRequest } from "../dtos/AuthenticatedRequest.dto";

export async function registerUsers(request: Request, response: Response) {
	const result = validationResult(request);
	console.log("Inside registerUsers: Result:", result);

	if (!result.isEmpty()) {
		return response.status(400).json({
			success: false,
			errors: result.array()
		});
	}
	const data = matchedData(request) as CreateUserDto;
	console.log('data:', data);

	try {
		// Verifier si l'utilisateur existe deja
		const existingUser = await prisma.user.findFirst({
			where: {
				OR : [
					{ email: data.email },
					{ username: data.username }
				]
			}
		});
		console.log('existingUser:', existingUser);

		if (existingUser) {
			return response.status(409).json({
				success: false,
				message: "A user with this email address or username already exists."
			});
		}

		// Hasher le mot de passe
		data.password = hashPassword(data.password);
		console.log('data.password:', data.password);

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
		console.log('Created user:', newUser);

		return response.status(201).json({
			success: true,
			user: newUser,
		});
	} catch (error) {
		console.error("Registration error:", error);
		return response.status(500).json({
			success: false,
			message: "Server error during registration"
		});
	}
};

export async function loginUser(request: Request, response: Response) {
	const result = validationResult(request);
	console.log("Inside loginUser: Result:", result);

	if (!result.isEmpty()) {
		return response.status(400).json({
			success: false,
			errors: result.array()
		});
	}

	const { email, password } = matchedData(request) as { email: string, password: string};
	console.log("email:", email);
	console.log("password:", password);

	try {
		// chercher l'utilisateur
		const user = await prisma.user.findUnique({
			where: { email: email },
		});
		console.log("user:", user);

		if (user?.isOnline) {
			return response.status(200).json({
				success: true,
				message: "already logged in"
			});
		}

		if (!user || !user.password) {
			return response.status(401).json({
				success: false,
				message: "Incorrect credentials"
			});
		}

		const isPasswordValid = comparePassword(password, user.password);
		console.log("isPasswordValid:", isPasswordValid);

		if (!isPasswordValid) {
			return response.status(401).json({
				success: false,
				message: "Incorrect credentials"
			});
		}

		// Generer les tokens
		const accessToken = generateAccessToken(user.id);
		console.log('accessToken:', accessToken);
		const refreshToken = generateRefreshToken(user.id);
		console.log('refreshToken:', refreshToken);

		// Mettre a jour le refresh token en base
		await prisma.user.update({
			where : { id : user.id },
			data: {
				isOnline: true,
				refreshToken : refreshToken
			}
		});

		// Configurer les cookies
		response.cookie("access_token", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 15 * 60 * 1000
		})

		response.cookie("refresh_token", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000
		});

		// Reponse sans le mot de passe
		const userWithoutPassword = {
			id: user.id,
			email: user.email,
			username: user.username,
			createdAt: user.createdAt,
		};
		console.log('userWithoutPassword:', userWithoutPassword);

		return response.status(200).json({
			success: true,
			user: userWithoutPassword,
			accessToken: accessToken
		});

	} catch (error) {
		console.error("Login error:", error);
		return response.status(500).json({
			success: false,
			message: "Server error during connection"
		});
	}
};

export async function logoutUser(request: AuthentificatedRequest, response: Response) {
	const cookie = request.cookies?.access_token;
	console.log("Inside logoutUser: cookie:", cookie);

	if (!cookie) {
		return response.status(401).json({
			success: false,
			message: "Access denied. Token missing."
		});
	}

	if (request.userId) {
		await prisma.user.update({
			where: { id: request.userId },
			data: { isOnline: false }
		});
	}

	response.clearCookie(cookie);
	return response.redirect('/');
}

export async function authHandler(request: Request, response: Response) {
	try {
		// Verification
		// console.log('req.user after passport:', request.user);
		// console.log('Type of req.user:', typeof request.user);
		// console.log('Keys:', request.user ? Object.keys(request.user) : 'null');
		if (!request.user) {
			throw new Error("No user found after authentication");
		}

		// Maintenant que TypeScript connais la structure
		const { id, username } = request.user;
		console.log(`Inside authHandler: User ${username} (${id}) authenticated via 42`);

		// Generer les tokens
		const accessToken = generateAccessToken(id);
		console.log('accessToken:', accessToken);
		const refreshToken = generateRefreshToken(id);
		console.log('refreshToken:', refreshToken);	
		
		// Mettre a jour le refresh token en BDD
		await prisma.user.update({
			where : { id: id },
			data: {
				refreshToken: refreshToken,
				isOnline: true
			}
		});

		// Set cookies et rediriger
		response.cookie("access_token", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 15 * 60 * 1000
		})

		response.cookie("refresh_token", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000
		});

		// redirection frontend
		return response.redirect("http://localhost:3100/health");

	} catch (error) {
		console.error('Callback error:', error);
		return response.redirect("http://google.com");
	}

}