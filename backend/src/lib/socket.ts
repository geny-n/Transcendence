import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { socketAuth } from "../middleware/socketAuth.js";
import cookieParser from "cookie-parser";
import prisma from "./prisma.js";
import { getAllFriendIds } from "../utils/helpers.js";
import { disconnectUser } from "../socket/disconnect.js";
import { initPong } from "../socket/pong.js";


let io: Server;

const onConnection = async (socket:Socket) => {
	const { user } = socket;

	// Verification concise
	if (!user) {
		console.error(`Socket without user passed middleware!`);
		socket.disconnect();
		return;
	}
	console.log(`User ${user.username} connecté${socket.isGuest ? " (invité)" : ""}.`);

	if (!socket.isGuest) {
		// Marquer comme en ligne
		await prisma.user.update({
			where: { id: user.id },
			data: { isOnline: true },
		});

		// Rejoindre la room personnelle pour les notifications
		socket.join(`user:${user.id}`);

		// Notifier les amis
		const friends = await getAllFriendIds(user.id);
		friends.forEach(friendId => {
			io.to(`user:${friendId}`).emit('friend:status_changed', {
				userId: user.id,
				isOnline: true
			});
		});

		// Gérer la déconnexion (met à jour la DB)
		disconnectUser(socket, io, friends);
	}

	// Initialiser les événements Pong (invités inclus)
	initPong(io, socket);
}

export const initSocket = (HttpServer: HttpServer) => {
	io = new Server(HttpServer, {
		cors: {
			origin: true,
			credentials: true
		}
	});

	// Middleware
	io.engine.use(cookieParser());
	io.use(socketAuth);

	// Gestion de connexion principale
	io.on("connection", onConnection);

	return io;
}

export const getIO = () => {
	if (!io) throw new Error("Socket.io not initialized");
	return io;
}