import type { Request, Response } from "express";
import { matchedData, query, validationResult } from "express-validator";
import prisma from "../lib/prisma.js";
import { comparePassword, hashPassword } from "../utils/helpers.js";
import { asyncHandler } from "../utils/asyncHandlers.js";

export const getMyProfile = asyncHandler(async (request:Request, response:Response) => {
	if (!request.user) {
		throw new Error("No user found after authentication");
	}

	const userWithoutPassword = {
		id : request.user.id,
		username: request.user.username,
		email: request.user.email,
		avatarUrl: request.user.avatarUrl,
	};
	console.log('inside getMyProfile: userWithoutPassword:', userWithoutPassword);

	return response.status(200).json({
		success: true,
		user: userWithoutPassword,
	});
});

export const getUserProfile = asyncHandler(async (request:Request, response:Response) => {
	const userId = request.params.id;
	console.log('inside getUserProfile: UserId:', userId);

	if (!userId || Array.isArray(userId)) {
		return response.status(401).json({
			success: false,
			message: "Multiple ID or empty ID not allowed"
		});
	}

	const user = await prisma.user.findFirst({
		where: { id: userId },
		omit: {
			password: true,
			refreshToken: true,
			fortyTwoId: true
		}
	});
	console.log('user:', user);

	if (!user) {
		return response.status(404).json({
			success: false,
			message: "User not found"
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
	console.log(`Update fields: Email(${username}), Username(${username})`);

	if (!request.user) {
		throw new Error("No user found after authentication");
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
		throw new Error("No user found after authentication");
	}
	const isPasswordValid = comparePassword(currentPassword, request.user.password);
	console.log("isPasswordValid:", isPasswordValid);

	if (!isPasswordValid) {
		return response.status(401).json({
			success: false,
			message: "Incorrect credentials"
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
		message: "Password updated successfully",
	});
});

export const changeAvatar = asyncHandler(async (request:Request, response:Response) => {
	if (!request.file || !request.user) {
		return response.status(400).json({
			success: false,
			message: "No file Uploaded."
		});
	}

	const avatarUrl = `/avatars/${request.file.filenameForMemoryStorage}`;
	console.log('Inside changeAvatar avatarUrl:', avatarUrl);

	const updateUser = await prisma.user.update({
		where: { id: request.user.id },
		data : { avatarUrl: avatarUrl }
	});
	console.log('updateUser:', updateUser);

	response.status(200).json({
		success: true,
		message: "Avatar uploaded succesfully",
		avatarUrl: avatarUrl
	});
});

export const searchUser = asyncHandler(async (request:Request, response:Response) => {
	const q = request.query.q as string | undefined;
	console.log("Inside searchUser q:", q);

	if (!q || typeof q !== 'string' || q.trim().length < 2) {
		return response.status(400).json({
			success: false,
			message: "The search query must contain at least 2 characters"
		})
	}

	const trimmedQ = q.trim();
	console.log("trimmedQ:", trimmedQ);

	if (!request.user) {
		return response.status(400).json({
			success: false,
			message: "No user found after authentication."
		});
	}

	const findUser = await prisma.user.findMany({
		where : { username: { contains: trimmedQ, }, },
		select : { id: true, username: true, avatarUrl: true },
		take: 10,
		orderBy: { username: 'asc' },
	});
	console.log("findUser:", findUser);

	if (!findUser) {
		return response.status(404).json({
			success: false,
			message: "User not found."
		})
	}

	response.status(200).json({
		success: true,
		users: findUser,
		count: findUser.length,
		query: trimmedQ,
	});
});