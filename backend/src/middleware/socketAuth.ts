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
		// Tentative de connexion en tant qu'invité
		const guestId   = socket.handshake.auth?.guestId   as string | undefined;
		const guestName = socket.handshake.auth?.guestName  as string | undefined;

		if (guestId && guestName && /^guest_[a-z0-9]+$/.test(guestId)) {
			socket.user = {
				id:           guestId,
				email:        null,
				password:     null,
				username:     guestName.slice(0, 24),
				fortyTwoId:   null,
				avatarUrl:    null,
				createdAt:    new Date(),
				isOnline:     false,
				refreshToken: null,
			};
			socket.isGuest = true;
			console.log(`Invité ${guestName} connecté (id: ${guestId}).`);
			return next();
		}

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