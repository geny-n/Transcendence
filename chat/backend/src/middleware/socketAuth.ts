import type { Socket, ExtendedError } from "socket.io";
import { verifyToken } from "../utils/helpers.js";
import prisma from "../lib/prisma.js";
import type { Request } from "express";

export const socketAuth = async function socketAuthentification(socket:Socket,
	next:(err?: ExtendedError | undefined) => void) {
	const req = socket.request as Request;
	const token  = req.cookies?.access_token;
	console.log("Inside socketAuth: token:", token);

	if (!token) {
		return next(new Error("Access denied. Token missing."));
	}

	const decoded = verifyToken(token);
	console.log("decoded:", decoded);

	if (!decoded) {
		return next(new Error("Invalid or expired Token."));
	}

	try {
		const user = await prisma.user.findFirst({
			where: { id: decoded.userId }
		})
		console.log("user:", user);

		if (!user) {
			return next(new Error("User not found."));
		}

		socket.user = user;
	} catch (error) {
		return next(new Error("Server error during authentification of the WebSocket."));
	}
	next();
}