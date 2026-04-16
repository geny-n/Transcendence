import type { Request, Response } from "express";
import { matchedData, validationResult } from "express-validator";
import prisma from "../lib/prisma.js";
import { comparePassword, getAllUsersIds, hashPassword } from "../utils/helpers.js";
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

	return response.status(200).json({
		success: true,
		user: user,
	});
});

export const getUserProfile = asyncHandler(async (request:Request, response:Response) => {
	const userId = request.params.id;

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

	if (!result.isEmpty()) {
		return response.status(400).json({
			success: false,
			errors: result.array()
		});
	}

	const { email, username } = matchedData(request) as { email: string | undefined, username: string | undefined };

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

	const userWithoutPassword = {
		id : updateUser.id,
		username: updateUser.username,
		email: updateUser.email,
		avatarUrl: updateUser.avatarUrl,
	};

	try {
		const io = getIO();
		const users = await getAllUsersIds();

		users.forEach(usersId => {
			io.to(`user:${usersId}`).emit('friend:profile_updated', {
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

	if (!result.isEmpty()) {
		return response.status(400).json({
			success: false,
			errors: result.array()
		});
	}

	let { currentPassword, newPassword } = matchedData(request) as { currentPassword: string, newPassword: string };

	if (!request.user || !request.user.password) {
		throw new Error("backend.profile.no.user.after.authentication");
	}
	const isPasswordValid = comparePassword(currentPassword, request.user.password);

	if (!isPasswordValid) {
		return response.status(401).json({
			success: false,
			message: "backend.profile.incorrect.credentials"
		});
	}

	newPassword = hashPassword(newPassword);

	const updateUser = await prisma.user.update({
		where: { id: request.user.id },
		data: { password: newPassword },
	});

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

	const updateUser = await prisma.user.update({
		where: { id: request.user.id },
		data : { avatarUrl: avatarUrl }
	});

	try {
		const io = getIO();
		const users = await getAllUsersIds();

		users.forEach(usersId => {
			io.to(`user:${usersId}`).emit('friend:avatar_updated', {
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

	if (!q || typeof q !== 'string' || q.trim().length < 2) {
		return response.status(400).json({
			success: false,
			message: "backend.profile.search.query.too.short"
		})
	}

	const trimmedQ = q.trim();

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