import type { Socket, ExtendedError } from "socket.io";
import { verifyToken } from "../utils/helpers.js";
import prisma from "../lib/prisma.js";
import type { Request } from "express";

// ─── Compteur d'invités (1-999, cycling) ─────────────────────────────────────
let guestCounter = 0;
function nextGuestLabel(): string {
	guestCounter = (guestCounter % 999) + 1;
	return `Invite${String(guestCounter).padStart(3, "0")}`;
}

export const socketAuth = async function socketAuthentification(socket:Socket,
	next:(err?: ExtendedError | undefined) => void) {
	const req = socket.request as Request;
	
	// 1. Chercher le token d'abord dans les cookies HTTP
	let token = req.cookies?.access_token;
	console.log("Inside socketAuth: token from cookies:", token ? "found" : "missing");

	// 2. Si pas trouvé, chercher dans socket.handshake.auth (fallback pour WebSocket sans cookies)
	if (!token && socket.handshake.auth?.token) {
		token = socket.handshake.auth.token as string;
		console.log("Inside socketAuth: token from auth.token:", token ? "found" : "missing");
	}

	if (!token) {
		// Tentative de connexion en tant qu'invité
		const guestId   = socket.handshake.auth?.guestId   as string | undefined;
		const guestName = socket.handshake.auth?.guestName  as string | undefined;

		if (guestId && guestName && /^guest_[a-z0-9]+$/.test(guestId)) {
			const assignedLabel = nextGuestLabel();
			socket.user = {
				id:				guestId,
				email:			null,
				password:		null,
				username:		assignedLabel,
				fortyTwoId:		null,
				avatarUrl:		null,
				createdAt:		new Date(),
				isOnline:		false,
				refreshToken:	null,
				role:			"GUEST" as const
			} as any;
			socket.isGuest = true;
			console.log(`Invité connecté → ${assignedLabel} (id: ${guestId}).`);
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
		socket.isGuest = false;
	} catch (error) {
		return next(new Error("Server error during authentification of the WebSocket."));
	}
	next();
}