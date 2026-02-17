import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { socketAuth } from "../middleware/socketAuth.js";
import cookieParser from "cookie-parser";
import prisma from "./prisma.js";
import { getAllFriendIds } from "../utils/helpers.js";
import { disconnectUser } from "../socket/disconnect.js";
import { PongSocketHandlers } from "../socket/pongHandlers.js";


let io: Server;

const onConnection = async (socket:Socket) => {
	const { user } = socket;

	// Verification concise
	if (!user) {
		console.error(`Socket without user passed middleware!`);
		socket.disconnect();
		return;
	}
	console.log(`User ${user.username} is connected.`);

	// Marquer comme en ligne
	await prisma.user.update({
		where: { id: user.id },
		data: { isOnline: true },
	});

	// Rejoindre la room personalle pour les notifications
	socket.join(`user:${user.id}`);

	// Notifier les amis
	const friends = await getAllFriendIds(user.id);
	friends.forEach(friendId => {
		io.to(`user:${friendId}`).emit('friend:status_changed', {
			userId: user.id,
			isOnline: true
		});
	})

	// Gerer la deconnexion
	disconnectUser(socket, io, friends);
}

export const initSocket = (HttpServer: HttpServer) => {
	io = new Server(HttpServer, {
		cors: {
			origin: true,
			credentials: true
		}
	});

	// Middleware pour les connexions principales (authentifiées)
	io.engine.use(cookieParser());
	io.use(socketAuth);

	// Gestion de connexion principale
	io.on("connection", onConnection);

	// Namespace séparé pour le Pong (sans authentification)
	const pongNamespace = io.of('/pong');
	const pongHandlers = new PongSocketHandlers();
	pongHandlers.setupHandlers(pongNamespace);
	console.log('Pong Multijoueur handlers initialized on /pong namespace');

	return io;
}

export const getIO = () => {
	if (!io) throw new Error("Socket.io not initialized");
	return io;
}