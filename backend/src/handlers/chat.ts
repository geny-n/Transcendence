import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandlers.js";

export const getChat = asyncHandler(async (request:Request, response:Response) => {
	if (!request.user) {
		throw new Error("No user found after authentication");
	}
	const userId = request.user.id;//mon id
    const friendId = request.params.friendId;

    const messages = await prisma.chatMessage.findMany({
		where: {
			OR: [
				{ senderId:userId, receiverId:friendId },
				{ senderId:friendId, receiverId:userId },
			]
		},
        
        orderBy: { time: 'asc' }
	});
	console.log('inside getChat: messages:', messages);

	return response.status(200).json({
		success: true,
		messages,
	});
});
