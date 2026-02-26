import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandlers.js";
import prisma from "../lib/prisma.js";
import { matchedData, validationResult } from "express-validator";
import { hashPassword } from "../utils/helpers.js";
import type { UserRoles } from "../../generated/prisma/enums.js";

export const listAllUsers = asyncHandler(async (req: Request, res: Response) => {
	let page = req.query.page ?? '1';
	console.log("Inside listAllUsers: page:", page);

	let size = req.query.size ?? '20';
	console.log("size:", size);

	let sortBy = req.query.sortBy ?? 'createdAt';
	console.log("sortBy:", sortBy);

	let sortDir = req.query.sortBy ?? 'desc';
	console.log("sortDir:", sortDir);

	if (typeof page !== 'string' || page.trim().length < 1 ||
		typeof size !== 'string' || size.trim().length < 1 ||
		typeof sortBy !== 'string' || typeof sortDir !== 'string' )  {
		return res.status(400).json({
			success: false,
			message: "Incorrect query paramaters"
		});
	}

	page = page.trim();
	size = size.trim();
	sortBy = sortBy.trim();
	sortDir = sortDir.trim();

	const usersList = await prisma.user.findMany({
		skip: (Number(page) - 1) * Number(size),
		take: Number(size),
		orderBy: {
			[sortBy]: sortDir,
		},
		omit: { password: true, refreshToken: true }
	});

	return res.status(200).json({
		success: true,
		usersList: usersList,
		count: usersList.length,
		query: [ {
			page: page,
			size: size,
			sortBy: sortBy,
			sortDir: sortDir
		} ]
	});
});

export const getUserByUsernameOrId = asyncHandler(async (req: Request, res: Response) => {
	const search = req.params.search;
	console.log("Inside getUserByUsername: search:", search);

	if (!search || Array.isArray(search)) {
		return res.status(401).json({
			success: false,
			message: "Multiple search params or empty not allowed"
		});
	}

	const user = await prisma.user.findFirst({
		where: {
			OR: [
				{ username: search },
				{ id: search }
			]
		},
		omit: { password: true, refreshToken: true }
	});

	if (!user) {
		return res.status(404).json({
			success: false,
			message: "User not found"
		});
	}

	return res.status(200).json({
		success: true,
		user: user
	});
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.params.id;
	console.log("Inside updateUser: userId:", userId);

	if (!userId || Array.isArray(userId)) {
		return res.status(401).json({
			success: false,
			message: "Multiple ID or empty ID not allowed"
		});
	}

	const result = validationResult(req);
	console.log("result:", result);

	if (!result.isEmpty()) {
		return res.status(400).json({
			success: false,
			errors: result.array()
		});
	}

	let {
		email,
		newPassword,
		username,
	} = matchedData(req) as {
		email: string | undefined,
		newPassword: string | undefined,
		username: string | undefined,
	};
	const avatarUrl = req.file?.filenameForMemoryStorage;
	console.log(`Update fields: Email(${email}), Password(${newPassword}), Username(${username})
		, Avatar(${avatarUrl})`);

	const user = await prisma.user.findFirst({ where: { id: userId } });
	console.log("user:", user);

	if (!user) {
		return res.status(404).json({
			success: false,
			message: "User not found."
		})
	}

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data : {
			email: email ? email : user.email,
			password: newPassword ? hashPassword(newPassword) : user.password,
			username: username ? username : user.username,
			avatarUrl: avatarUrl ? avatarUrl : user.avatarUrl
		},
		omit: { password: true, refreshToken: true }
	});
	console.log("updatedUser:", updatedUser);

	return res.status(200).json({
		success: true,
		updatedUser: updatedUser
	});
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.params.id;
	console.log("Inside deleteUser: userId:", userId);

	if (!userId || Array.isArray(userId)) {
		return res.status(401).json({
			success: false,
			message: "Multiple ID or empty ID not allowed"
		});
	}

	await prisma.user.delete({ where: { id: userId } })

	return res.status(200).json({
		success: true,
		message: "User deleted succesfully"
	});
});

export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.params.id;
	console.log("Inside changeUserRole: userId:", userId);

	if (!userId || Array.isArray(userId)) {
		return res.status(401).json({
			success: false,
			message: "Multiple ID or empty ID not allowed"
		});
	}

	if (userId === req.user?.id) {
		return res.status(403).json({
			success: false,
			message: "Change your own role is forbidden"
		});
	}

	const role = req.query.role;
	console.log("role:", role);

	const allowedRoles = ['user', 'admin', 'moderator'];

	if (typeof role !== 'string' || !role || !allowedRoles.includes(role.toLowerCase()))  {
		return res.status(400).json({
			success: false,
			message: "Incorrect query paramaters"
		});
	}

	const found = allowedRoles.find((element) => element === role.toLowerCase());
	console.log("found:", found);

	const newRole = found?.toUpperCase() as UserRoles;

	const roleUpdated = await prisma.user.update({
		where: { id: userId },
		data: { role: newRole },
		select: { role: true }
	});

	return res.status(200).json({
		success: true,
		roleUpdated: roleUpdated,
		query: role
	});
});