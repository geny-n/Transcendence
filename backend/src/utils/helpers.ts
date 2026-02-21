import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import prisma from "../lib/prisma.js";

const saltRounds = 10;
const JWT_ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const JWT_REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export const hashPassword = (password: string) : string => {
	const salt = bcrypt.genSaltSync(saltRounds)
	return bcrypt.hashSync(password, salt)
};

export const comparePassword = (plain: string, hashed: string) : boolean => {
	return bcrypt.compareSync(plain, hashed)
}

export const generateAccessToken = (userId: string) : string  => {
	return jwt.sign(
		{ userId, type: "access" },
		JWT_ACCESS_SECRET,
		{ expiresIn: "15m", }
	);
}

export const generateRefreshToken = (userId: string) : string => {
	return jwt.sign(
		{ userId, type: "refresh" },
		JWT_REFRESH_SECRET,
		{ expiresIn: "7d", }
	);
};

export const verifyToken = (token: string, isRefresh = false) : any => {
	try {
		const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_ACCESS_SECRET;
		console.log("Inside verifyToken: secret:", secret);
		return jwt.verify(token, secret);
	} catch (error) {
		return null;
	}
}

export const getAllFriendIds = async ( userId: string ): Promise<string[]> => {
	const friend = await prisma.friend.findMany({
		where: {
			OR: [{ user1Id: userId }, { user2Id: userId }]
		},
		select: { user1Id: true, user2Id: true }
	})
	console.log("Inside getAllFriendIds:", friend);

	return friend.map((f: { user1Id: string; user2Id: string; }) =>
		f.user1Id === userId ? f.user2Id : f.user1Id
	);
}