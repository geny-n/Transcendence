import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandlers.js";

//reccuperer l historique des messages et les envoie dans l ordre vers le front pour affichier tous les messages
export const getChat = asyncHandler(async (request:Request, response:Response) => {
	if (!request.user) {
		throw new Error("No user found after authentication");
	}
	const userId = request.user.id as string;//mon id
    const friendId = request.params.friendId as string;

    const messages = await prisma.chatMessage.findMany({
		where: {
			OR: [
				{ senderId:userId, receiverId:friendId },
				{ senderId:friendId, receiverId:userId },
			]
		},
        
        orderBy: { time: 'asc' } //du plus encien au plus recent
	});
	// console.log('inside getChat: messages:', messages);

	return response.status(200).json({
		success: true,
		messages,
	});
});


//mets la variable read a true si c etait en false
export const markAsRead = asyncHandler(async (request:Request, response:Response) => {
	if (!request.user) {
		throw new Error("No user found after authentication");
	}
	const userId = request.user.id as string;//mon id
    const friendId = request.params.friendId as string;

    await prisma.chatMessage.updateMany({
		where: { senderId:friendId, receiverId:userId, read:false },
		data: { read: true },
	});

	return response.status(200).json({ success: true });
});
