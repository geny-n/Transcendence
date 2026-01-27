export declare const hashPassword: (password: string) => string;
export declare const comparePassword: (plain: string, hashed: string) => boolean;
export declare const generateAccessToken: (userId: string) => string;
export declare const generateRefreshToken: (userId: string) => string;
export declare const verifyToken: (token: string, isRefresh?: boolean) => any;
//# sourceMappingURL=helpers.d.ts.map