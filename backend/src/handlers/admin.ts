import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandlers.js";
import prisma from "../lib/prisma.js";
import { matchedData, validationResult } from "express-validator";
import { hashPassword } from "../utils/helpers.js";
import type { UserRoles } from "../../generated/prisma/enums.js";

const sortableFields = ['createdAt', 'username', 'email', 'role', 'isOnline'] as const;
type SortField = (typeof sortableFields)[number];

const isSortField = (value: string): value is SortField => {
	return sortableFields.includes(value as SortField);
};

const baseUserSelect = {
	id: true,
	email: true,
	username: true,
	avatarUrl: true,
	role: true,
	isOnline: true,
	createdAt: true,
} as const;

export const listAllUsers = asyncHandler(async (req: Request, res: Response) => {
	const pageRaw = req.query.page ?? '1';
	const sizeRaw = req.query.size ?? '20';
	const sortByRaw = req.query.sortBy ?? 'createdAt';
	const sortDirRaw = req.query.sortDir ?? 'desc';
	const searchRaw = req.query.search;

	if (typeof pageRaw !== 'string' || typeof sizeRaw !== 'string' || typeof sortByRaw !== 'string' || typeof sortDirRaw !== 'string') {
		return res.status(400).json({
			success: false,
			message: "backend.admin.incorect.query.params"
		});
	}

	const page = Number.parseInt(pageRaw.trim(), 10);
	const size = Number.parseInt(sizeRaw.trim(), 10);
	const sortBy = sortByRaw.trim();
	const sortDir = sortDirRaw.trim().toLowerCase();
	const search = typeof searchRaw === 'string' ? searchRaw.trim() : '';

	if (!Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1 || size > 100) {
		return res.status(400).json({
			success: false,
			message: "backend.admin.invalid.page.size"
		});
	}

	if (!isSortField(sortBy) || (sortDir !== 'asc' && sortDir !== 'desc')) {
		return res.status(400).json({
			success: false,
			message: "backend.admin.invalid.sorting.params"
		});
	}

	const whereClause = search
		? {
			OR: [
				{ username: { contains: search } },
				{ email: { contains: search } },
				{ id: { contains: search } },
			],
		}
		: undefined;

	const findManyArgs: Parameters<typeof prisma.user.findMany>[0] = {
		skip: (page - 1) * size,
		take: size,
		orderBy: {
			[sortBy]: sortDir,
		},
		select: {
			...baseUserSelect,
			_count: {
				select: {
					sentFriendRequests: true,
					receivedFriendRequests: true,
					friendshipAsUser1: true,
					friendshipAsUser2: true,
					msgSent: true,
					MsgReceived: true,
					matchWins: true,
					matchLosses: true,
				}
			}
		}
	};

	const countArgs: Parameters<typeof prisma.user.count>[0] = {};

	if (whereClause) {
		findManyArgs.where = whereClause;
		countArgs.where = whereClause;
	}

	const [usersList, total] = await Promise.all([
		prisma.user.findMany(findManyArgs),
		prisma.user.count(countArgs)
	]);

	const totalPages = Math.ceil(total / size);

	return res.status(200).json({
		success: true,
		usersList,
		count: usersList.length,
		total,
		page,
		size,
		totalPages,
		sortBy,
		sortDir,
		search,
	});
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.params.id;
	console.log("Inside updateUser: userId:", userId);

	if (!userId || Array.isArray(userId)) {
		return res.status(401).json({
			success: false,
			message: "backend.admin.invalid.user.id"
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

	const {
		email,
		newPassword,
		username,
	} = matchedData(req) as {
		email: string | undefined,
		newPassword: string | undefined,
		username: string | undefined,
	};
	const avatarFilename = req.file?.filenameForMemoryStorage;
	const avatarUrl = avatarFilename ? `/avatars/${avatarFilename}` : undefined;

	const user = await prisma.user.findFirst({ where: { id: userId } });

	if (!user) {
		return res.status(404).json({
			success: false,
			message: "backend.admin.user.not.found"
		})
	}

	const data: {
		email?: string | null;
		password?: string | null;
		username?: string;
		avatarUrl?: string | null;
	} = {};

	if (typeof email === 'string') data.email = email;
	if (typeof username === 'string') data.username = username;
	if (typeof newPassword === 'string') data.password = hashPassword(newPassword);
	if (typeof avatarUrl === 'string') data.avatarUrl = avatarUrl;

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data,
		select: baseUserSelect,
	});

	return res.status(200).json({
		success: true,
		updatedUser
	});
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.params.id;
	console.log("Inside deleteUser: userId:", userId);

	if (!userId || Array.isArray(userId)) {
		return res.status(401).json({
			success: false,
			message: "backend.admin.invalid.user.id"
		});
	}

	if (userId === req.user?.id ) {
		return res.status(403).json({
			success: false,
			message: "backend.admin.delete.self.forbidden"
		});		
	}

	const found = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
	if (!found) {
		return res.status(404).json({
			success: false,
			message: "backend.admin.user.not.found"
		});
	}

	await prisma.user.delete({ where: { id: userId } });

	return res.status(200).json({
		success: true,
		message: "backend.admin.delete.success"
	});
});

export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.params.id;
	console.log("Inside changeUserRole: userId:", userId);

	if (!userId || Array.isArray(userId)) {
		return res.status(401).json({
			success: false,
			message: "backend.admin.invalid.user.id"
		});
	}

	if (userId === req.user?.id) {
		return res.status(403).json({
			success: false,
			message: "backend.admin.change.own.role.forbidden"
		});
	}

	const result = validationResult(req);
	if (!result.isEmpty()) {
		return res.status(400).json({
			success: false,
			errors: result.array()
		});
	}

	const { role } = matchedData(req, { locations: ['body'] }) as { role: UserRoles };
	if (!role) {
		return res.status(400).json({
			success: false,
			message: "backend.admin.role.required"
		});
	}

	const roleUpdated = await prisma.user.update({
		where: { id: userId },
		data: { role },
		select: { role: true }
	});

	return res.status(200).json({
		success: true,
		roleUpdated,
		query: role,
	});
});