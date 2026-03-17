import type { Request, Response } from "express";
import { matchedData, validationResult } from "express-validator";
import prisma from "../lib/prisma.js";
import { getIO } from "../lib/socket.js";
import { asyncHandler } from "../utils/asyncHandlers.js";

export const sendFriendRequest = asyncHandler(async (request:Request, response:Response) => {
	const io = getIO();
	if (!request.user) {
		return response.status(401).json({
			success: false,
			message: "No user found after authentication"
		});
	}

	const result = validationResult(request);
	console.log("Inside sendFriendRequest: Result:", result);

	if (!result.isEmpty()) {
		return response.status(400).json({
			success: false,
			errors: result.array()
		});
	}

	const { receiverId } = matchedData(request) as { receiverId: string };
	console.log("receiverId:", receiverId);

	const senderId = request.user.id; // Depuis le token JWT
	console.log("senderId:", senderId);

	// Validation
	if (senderId === receiverId) {
		return response.status(400).json({
			success: false,
			message: "Cannot add yourself"
		});
	}

	// Verifier si demande existe deja
	const existing = await prisma.friendship.findFirst({
		where : {
			OR: [
				{ senderId, receiverId },
				{ senderId: receiverId, receiverId: senderId }
			]
		}
	});
	console.log("existing:", existing);

	if (existing) {
		switch (existing.status) {
			case 'ACCEPTED':
				return response.status(400).json({ success: false, message: 'You are already friends.' });

			case 'PENDING':
				return response.status(400).json({ success: false, message: 'A friend request is already pending' });

			case 'REJECTED': case 'UNFRIENDED':
				if (existing.senderId === receiverId && existing.receiverId === senderId) {
					const updated = await prisma.friendship.update({
						where: { id: existing.id },
						data : {
							senderId: senderId,
							receiverId: receiverId,
							status: 'PENDING'
						},
						include: { receiver : { select: { id: true, username: true } } },
					});
					io.to(`user:${receiverId}`).emit("friend:request_received", {
						requestId: updated.id,
						sender: senderId
					});
					return response.status(200).json({success: true, updated});
				} else {
					const updated = await prisma.friendship.update({
						where: { id: existing.id },
						data : { status: 'PENDING' },
						include: { receiver : { select: { id: true, username: true } } },
					});
					io.to(`user:${receiverId}`).emit("friend:request_received", {
						requestId: updated.id,
						sender: senderId
					});
					return response.status(200).json({success: true, updated});
				}

			case 'BLOCKED':
				if (existing.senderId === senderId) {
					return response.status(403).json({ success: false, message: 'You have blocked this user.' });
				} else {
					return response.status(403).json({ success: false, message: 'You are blocked by this user.' });
				}
			default:
				return response.status(400).json({ success: false, message: 'Unable to send request.' });
		}
	}

	// Creer la demande
	const newRequest = await prisma.friendship.create({
		data: {
			senderId,
			receiverId,
			status: "PENDING"
		},
		include: {
			receiver: { select : { id: true, username: true } }
		}
	});
	console.log("req:", newRequest);

	// Evenement Websocket pour notifier le receveur
	io.to(`user:${receiverId}`).emit("friend:request_received", {
		requestId: newRequest.id,
		sender: senderId
	})

	response.status(200).json({success: true, newRequest});
});

export const friendRequestAction = asyncHandler(async (request:Request, response:Response) => {
	const io = getIO();

	if (!request.user) {
		return response.status(401).json({
			success: false,
			message: "No user found after authentication"
		});
	}

	const userId = request.user.id;
	console.log("Inside friendRequestAction: userId:", userId);

	const result = validationResult(request);
	console.log("Result:", result);

	if (!result.isEmpty()) {
		return response.status(400).json({
			success: false,
			errors: result.array()
		});
	}

	const requestId = request.params.id;
	console.log("requestId:", requestId);

	if (!requestId || Array.isArray(requestId)) {
		return response.status(401).json({
			success: false,
			message: "Multiple ID not allowed"
		});
	}

	const { action } = matchedData(request) as { action: string };
	console.log("action:", action);

	const friendship = await prisma.friendship.findUnique({
		where: { id: requestId },
		include: { sender: true, receiver: true }
	})
	console.log("friendship:", friendship);

	if (!friendship) {
		return response.status(404).json({
			success: false,
			message: "Friend request not found"
		});
	}

	const isSender = friendship.senderId === userId;
	console.log("isSender:", isSender);
	const isReceiver = friendship.receiverId === userId;
	console.log("isReceiver:", isReceiver);

	if (!isSender && !isReceiver) {
		return response.status(403).json({
			success: false,
			message: "Not authorized"
		});
	}

	const [minId, maxId] = [friendship.senderId, friendship.receiverId].sort();

	if (!minId || !maxId) {
		return response.status(500).json({
			success: false,
			message: "Internal Error"
		});
	}

	switch (action) {
		case "accept":
			if (!isReceiver) {
				return response.status(403).json({
					success: false,
					message: "Only the receiver can accept"
				});
			}

			if (friendship.status !== "PENDING") {
				return response.status(400).json({
					success: false,
					message: "Request is not pending"
				});
			}

			await prisma.$transaction([
				prisma.friendship.update({
					where: { id: requestId },
					data: { status: "ACCEPTED" },
				}),
				prisma.friend.create({
					data: {
						user1Id: minId,
						user2Id: maxId,
					},
				}),
			]);

			io.to(`user:${friendship.senderId}`).emit("friend:request_accepted", {
				friendId: friendship.receiverId,
				username: friendship.receiver.username,
				avatarUrl: friendship.receiver.avatarUrl,
				isOnline: friendship.receiver.isOnline,
			});

			io.to(`user:${friendship.receiverId}`).emit("friend:request_accepted", {
				friendId: friendship.senderId,
				username: friendship.sender.username,
				avatarUrl: friendship.sender.avatarUrl,
				isOnline: friendship.sender.isOnline,
			});
			break;

		case "reject":
			if (!isReceiver) {
				return response.status(403).json({
					success: false,
					message: "Only the receiver can reject"
				});
			}

			if (friendship.status !== "PENDING") {
				return response.status(400).json({
					success: false,
					message: "Request is not pending"
				});
			}

			await prisma.friendship.update({
					where: { id: requestId },
					data: { status: "REJECTED" },
				});

			io.to(`user:${friendship.senderId}`).emit("friend:request_rejected", {
				requestId: friendship.id,
				userId: userId
			});
			break;

		case "cancel":
			if (!isSender) {
				return response.status(403).json({
					success: false,
					message: "Only the sender can cancel"
				});
			}

			if (friendship.status !== "PENDING") {
				return response.status(400).json({
					success: false,
					message: "Request is not pending"
				});
			}

			await prisma.friendship.delete({ where: { id: requestId } });

			io.to(`user:${friendship.receiverId}`).emit("friend:request_cancel", {
				requestId: friendship.id,
			});
			break;

		case "block":
			await prisma.friendship.upsert({
				where: { id: requestId },
				update: { status: "BLOCKED" },
				create: {
					senderId: userId,
					receiverId: isSender ? friendship.receiverId : friendship.senderId,
					status: "BLOCKED",
				}
			})

			const friendRecord = await prisma.friend.findUnique({
				where: {
					user1Id_user2Id: {
						user1Id: minId,
						user2Id: maxId
					}
				}
			})

			if (friendRecord) {
				await prisma.friend.delete({ where: { id: friendRecord.id } });
			}

			io.to(`user:${isSender ? friendship.receiverId : friendship.senderId}`).emit("friend:block", {
				blockId: userId,
			});
			break;
		default:
			return response.status(400).json({ success: false, message: "Invalid action" });
	}

	return response.status(200).json({ success: true, action, requestId, });
});

export const getFriendList = asyncHandler(async (request:Request, response:Response) => {
	if (!request.user) {
		return response.status(401).json({
			success: false,
			message: "No user found after authentication"
		});
	}
	const userId = request.user.id;
	console.log("Inside getFriendList: userId:", userId);

	const friends = await prisma.friend.findMany({
		where: {
			OR: [{ user1Id: userId }, { user2Id: userId }]
		},
		include: {
			user1: { select: { id: true, username: true, isOnline: true, avatarUrl: true } },
			user2: { select: { id: true, username: true, isOnline: true, avatarUrl: true } }
		}
	});
	console.log("friends:", friends);

	response.status(200).json({ success: true, friends });
});

export const getPendingRequests = asyncHandler(async (request:Request, response:Response) => {
	if (!request.user) {
		return response.status(401).json({
			success: false,
			message: "No user found after authentication"
		});
	}

	const userId = request.user.id;
	console.log("Inside getPendingRequestst: userId:", userId);

	const pending = await prisma.friendship.findMany({
		where: {
			OR: [
				{ receiverId: userId },
				{ senderId: userId },
			],
			status: "PENDING"
		},
		include: {
			sender: { select: { id: true, username: true , avatarUrl:true } }
		}
	});
	console.log("pending:", pending);

	response.status(200).json({ success: true, requests: pending });
});

export const unfriend = asyncHandler(async (request:Request, response:Response) => {
	if (!request.user) {
		return response.status(401).json({
			success: false,
			message: "No user found after authentication"
		});
	}

	const io = getIO();
	const userId = request.user.id;
	console.log("Inside unfriend: userId:", userId);

	const unfriendUserId = request.params.id;
	console.log("unfriendUserId:", unfriendUserId);

	if (!unfriendUserId || Array.isArray(unfriendUserId)) {
		return response.status(401).json({
			success: false,
			message: "Multiple ID not allowed"
		});
	}

	const [minId, maxId] = [userId, unfriendUserId].sort();

	if (!minId || !maxId) {
		return response.status(500).json({
			success: false,
			message: "Internal Error"
		});
	}

	const friendRecord = await prisma.friend.findUnique({
		where: {
			user1Id_user2Id: {
				user1Id: minId,
				user2Id: maxId
			}
		}
	})

	if (!friendRecord) {
		return response.status(404).json({ success: false, message: 'Not friends.' });
	}

	await prisma.friend.delete({ where: { id: friendRecord.id } });

	const friendship = await prisma.friendship.findFirst({
		where: {
			OR: [
				{ senderId: minId, receiverId: maxId },
				{ senderId: maxId, receiverId: minId }
			],
			status: 'ACCEPTED'
		}
	});

	if (friendship) {
		await prisma.friendship.update({
			where: { id: friendship.id },
			data: { status: 'UNFRIENDED' }
		});
	}

	io.to(`user:${userId}`).emit('friend:unfriended', { unfriendedUserId: unfriendUserId });
	io.to(`user:${unfriendUserId}`).emit('friend:unfriended', { unfriendBy: userId, });

	response.status(200).json({ success: true, message: 'Unfriended' });
});