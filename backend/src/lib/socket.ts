import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { socketAuth } from "../middleware/socketAuth.js";
import cookieParser from "cookie-parser";
import prisma from "./prisma.js";
import { getAllFriendIds } from "../utils/helpers.js";
import { disconnectUser } from "../socket/disconnect.js";
import { initPong } from "../socket/pong.js";
import { toxicityScale } from "./moderation.js";

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
		// Marquer comme en ligne (uniquement pour les utilisateurs authentifiés)
		await prisma.user.update({
			where: { id: user.id },
			data: { isOnline: true },
		});

		// Rejoindre la room personnelle pour les notifications
		socket.join(`user:${user.id}`);

		void toxicityScale("1st ping");
		const keepAlive = setInterval(() => {
			toxicityScale("ping").catch(() => {});
		}, 30 * 1000);
		
		// Notifier les amis
		const friends = await getAllFriendIds(user.id);
		friends.forEach(friendId => {
			io.to(`user:${friendId}`).emit('friend:status_changed', {
				userId: user.id,
				isOnline: true
			});
		});

		// Écouter les messages privés (uniquement pour les utilisateurs authentifiés)
		socket.on("privMessage", async({user, text, time, receivedId, read}) => {
			// console.log(`message envoyé de ${user} à ${receivedId}`);
			//envoie du message dans la bdd
			if (!text || text.length > 500)
				return;
			
			const message = await prisma.chatMessage.create ({
				data: {
					message: text,
					time: new Date(),
					senderId: socket.user.id,
					receiverId: receivedId,
					read: false,
					status: "PENDING",
				}
			});
			
			socket.emit("privMessage", { user, text, time, senderId: socket.user.id, id: message.id });
			toxicityScale(text).then(async ({ flag }) => {
				if (flag)
				{//msg toxic supprime puis warning au sender
					await prisma.chatMessage.delete({
						where: { id: message.id }
					}).catch(() => {});
					socket.emit("MessageBlocked", { id: message.id });
				}
				else // pas toxic change status en SENT puis envoie a l ami
				{
					await prisma.chatMessage.update({
						where: { id: message.id },
						data: { status: 'SENT'}
					}).catch(() => {});
					socket.to(`user:${receivedId}`).emit("privMessage", { user, text, time, senderId: socket.user.id });
				}
			})
			// const { flag } = await toxicityScale(text);
			
		});

		// Gérer la déconnexion (met à jour la DB)
		disconnectUser(socket, io, friends);
		socket.on("disconnect", () => {
			clearInterval(keepAlive);
		});
	}

	// Initialiser les événements Pong (invités inclus)
	initPong(io, socket);
}

export const initSocket = (HttpServer: HttpServer) => {
	io = new Server(HttpServer, {
		cors: {
			origin: process.env.FRONTEND_URL,
			credentials: true
		}
	});

	// Middleware
	io.engine.use(cookieParser());
	io.use(socketAuth);

	// Gestion de connexion principale
	io.on("connection", onConnection);

	// ── Namespace public /scoreboard (sans authentification) ─────────────────
	// Permet aux visiteurs non connectés de recevoir les événements en temps réel
	const scoreboardNs = io.of("/scoreboard");
	scoreboardNs.on("connection", (socket) => {
		console.log(`[Scoreboard] Viewer connecté: ${socket.id}`);
		socket.on("disconnect", () => {
			console.log(`[Scoreboard] Viewer déconnecté: ${socket.id}`);
		});
	});

	// ── Namespace public /leaderboard (sans authentification) ────────────────
	// Permet aux visiteurs non connectés de recevoir les mises à jour du leaderboard
	const leaderboardNs = io.of("/leaderboard");
	leaderboardNs.on("connection", (socket) => {
		console.log(`[Leaderboard] Viewer connecté: ${socket.id}`);
		socket.on("disconnect", () => {
			console.log(`[Leaderboard] Viewer déconnecté: ${socket.id}`);
		});
	});

	return io;
}

export const getIO = () => {
	if (!io) throw new Error("Socket.io not initialized");
	return io;
}