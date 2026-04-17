import type { DisconnectReason, Server, Socket } from "socket.io";
import prisma from "../lib/prisma.js";
import { errorHandler } from "../utils/asyncHandlers.js";

export const disconnectUser = async (socket:Socket, io:Server, friends: string[]) => {
	const { user } = socket

	socket.on("disconnect", errorHandler( async (reason:DisconnectReason) => {
		const sockets = await io.in(`user:${user.id}`).fetchSockets();

		// Ne pas mettre à jour la DB pour les invités
		if (!socket.isGuest && !sockets.length) {
			await prisma.user.update({
				where: { id: user.id },
				data: { isOnline: false },
			});

			// Notifier les amis
			friends.forEach(friendId => {
				io.to(`user:${friendId}`).emit('friend:status_changed', {
					userId: user.id,
					isOnline: false
				});
			});
		}

		console.log(`User ${user.username} déconnecté${socket.isGuest ? " (invité)" : ""} , reason: ${reason}.`);

	}));
}