import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
const saltRounds = 10;
const JWT_ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || "D@O3)mqj?gj8]kbUE=pRPB#hK(SadE]^:]ebg^/O3m_";
const JWT_REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "[/}%uC:5U!dCJu.67/{Q}Q9V@.V/_tu>3mL$0%5P32A";
export const hashPassword = (password) => {
    const salt = bcrypt.genSaltSync(saltRounds);
    return bcrypt.hashSync(password, salt);
};
export const comparePassword = (plain, hashed) => {
    return bcrypt.compareSync(plain, hashed);
};
export const generateAccessToken = (userId) => {
    return jwt.sign({ userId, type: "access" }, JWT_ACCESS_SECRET, { expiresIn: "15m", });
};
export const generateRefreshToken = (userId) => {
    return jwt.sign({ userId, type: "refresh" }, JWT_REFRESH_SECRET, { expiresIn: "7d", });
};
export const verifyToken = (token, isRefresh = false) => {
    try {
        const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_ACCESS_SECRET;
        console.log("secret:", secret);
        return jwt.verify(token, secret);
    }
    catch (error) {
        return null;
    }
};
//# sourceMappingURL=helpers.js.map