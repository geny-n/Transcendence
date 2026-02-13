import type { Server, Socket } from "socket.io";
import prisma from "../lib/prisma.js";

export const disconnectUser = async (socket:Socket, io:Server, friends: string[]) => {
	const { user } = socket

	socket.on("disconnect", async () => {
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
	});
}