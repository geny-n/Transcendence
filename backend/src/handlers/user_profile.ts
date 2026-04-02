import type { Request, Response } from "express";
import { matchedData, validationResult } from "express-validator";
import prisma from "../lib/prisma.js";
import { comparePassword, getAllFriendIds, hashPassword } from "../utils/helpers.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { getIO } from "../lib/socket.js";

export const getMyProfile = asyncHandler(async (request:Request, response:Response) => {
	if (!request.user) {
		throw new Error("backend.profile.no.user.after.authentication");
	}

	const user = await prisma.user.findFirst({
		where: { id: request.user.id },
		select: {
			id: true,
			username: true,
			email: true,
			avatarUrl: true,
			role: true,
			createdAt: true,
			level: true,
			experience: true,
			matchWins: true,
			matchLosses: true,
		},
	});
	console.log('inside getMyProfile: user:', user);

	return response.status(200).json({
		success: true,
		user: user,
	});
});

export const getUserProfile = asyncHandler(async (request:Request, response:Response) => {
	const userId = request.params.id;
	console.log('inside getUserProfile: UserId:', userId);

	if (!userId || Array.isArray(userId)) {
		return response.status(401).json({
			success: false,
			message: "backend.profile.invalid.user.id"
		});
	}

	const user = await prisma.user.findFirst({
		where: { id: userId },
		select: {
			id: true,
			username: true,
			email: true,
			avatarUrl: true,
			createdAt: true,
			level: true,
			experience: true,
		}
	});
	console.log('user:', user);

	if (!user) {
		return response.status(404).json({
			success: false,
			message: "backend.profile.user.not.found"
		});
	}

	return response.status(200).json({
		success: true,
		user: user,
	});
});

export const updateMyProfile = asyncHandler(async (request:Request, response:Response) => {
	const result = validationResult(request);
	console.log("Inside updateMyProfile: Result:", result);

	if (!result.isEmpty()) {
		return response.status(400).json({
			success: false,
			errors: result.array()
		});
	}

	const { email, username } = matchedData(request) as { email: string | undefined, username: string | undefined };
	console.log(`Update fields: Email(${email}), Username(${username})`);

	if (!request.user) {
		throw new Error("backend.profile.no.user.after.authentication");
	}

	const updateUser = await prisma.user.update({
		where: { id: request.user.id },
		data: {
			email: email? email : request.user.email,
			username: username? username : request.user.username,
		},
	});
	console.log("updateUser:", updateUser);

	const userWithoutPassword = {
		id : updateUser.id,
		username: updateUser.username,
		email: updateUser.email,
		avatarUrl: updateUser.avatarUrl,
	};
	console.log('userWithoutPassword:', userWithoutPassword);

	try {
		const io = getIO();
		const friends = await getAllFriendIds(request.user.id);

		friends.forEach(friendsId => {
			io.to(`user:${friendsId}`).emit('friend:profile_updated', {
				userId : userWithoutPassword.id,
				user: userWithoutPassword
			})
		});
	} catch (error) {
		console.error('Socket broadcast error (non-blocking):', error);
	}

	return response.status(200).json({
		success: true,
		user: userWithoutPassword,
	});
});

export const changePassword = asyncHandler(async (request:Request, response:Response) => {
	const result = validationResult(request);
	console.log("Inside changePassword: Result:", result);

	if (!result.isEmpty()) {
		return response.status(400).json({
			success: false,
			errors: result.array()
		});
	}

	let { currentPassword, newPassword } = matchedData(request) as { currentPassword: string, newPassword: string };
	console.log(`Change Password fields: currentPassword(${currentPassword}), newPassword(${newPassword})`);

	if (!request.user || !request.user.password) {
		throw new Error("backend.profile.no.user.after.authentication");
	}
	const isPasswordValid = comparePassword(currentPassword, request.user.password);
	console.log("isPasswordValid:", isPasswordValid);

	if (!isPasswordValid) {
		return response.status(401).json({
			success: false,
			message: "backend.profile.incorrect.credentials"
		});
	}

	newPassword = hashPassword(newPassword);
	console.log('newPassword:', newPassword);

	const updateUser = await prisma.user.update({
		where: { id: request.user.id },
		data: { password: newPassword },
	});
	console.log("updateUser:", updateUser);

	return response.status(200).json({
		success: true,
		message: "backend.profile.password.updated",
	});
});

export const changeAvatar = asyncHandler(async (request:Request, response:Response) => {
	if (!request.file || !request.user) {
		return response.status(400).json({
			success: false,
			message: "backend.profile.no.file.uploaded"
		});
	}

	const avatarUrl = `/avatars/${request.file.filenameForMemoryStorage}`;
	console.log('Inside changeAvatar avatarUrl:', avatarUrl);

	const updateUser = await prisma.user.update({
		where: { id: request.user.id },
		data : { avatarUrl: avatarUrl }
	});
	console.log('updateUser:', updateUser);

	try {
		const io = getIO();
		const friends = await getAllFriendIds(request.user.id);

		friends.forEach(friendsId => {
			io.to(`user:${friendsId}`).emit('friend:avatar_updated', {
				userId : updateUser.id,
				avatarUrl: avatarUrl
			})
		});
	} catch (error) {
		console.error('Socket broadcast error (non-blocking):', error);
	}

	response.status(200).json({
		success: true,
		message: "backend.profile.avatar.uploaded",
		avatarUrl: avatarUrl
	});
});

export const searchUser = asyncHandler(async (request:Request, response:Response) => {
	const q = request.query.q;
	console.log("Inside searchUser q:", q);

	if (!q || typeof q !== 'string' || q.trim().length < 2) {
		return response.status(400).json({
			success: false,
			message: "backend.profile.search.query.too.short"
		})
	}

	const trimmedQ = q.trim();
	console.log("trimmedQ:", trimmedQ);

	if (!request.user) {
		return response.status(400).json({
			success: false,
			message: "backend.profile.no.user.after.authentication"
		});
	}

	const findUser = await prisma.user.findMany({
		where : { username: { contains: trimmedQ, }, role: 'USER' },
		select : { id: true, username: true, avatarUrl: true, isOnline: true, email: true, createdAt:true, level: true, experience: true},
		take: 10,
		orderBy: { username: 'asc' },
	});
	console.log("findUser:", findUser);

	if (!findUser) {
		return response.status(404).json({
			success: false,
			message: "backend.profile.user.not.found"
		})
	}
	response.status(200).json({
		success: true,
		users: findUser,
		count: findUser.length,
		query: trimmedQ,
	});
});