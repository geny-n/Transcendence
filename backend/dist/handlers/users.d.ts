import type { Request, Response } from "express";
import type { AuthentificatedRequest } from "../dtos/AuthenticatedRequest.dto.js";
export declare function registerUsers(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
export declare function loginUser(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
export declare function logoutUser(request: AuthentificatedRequest, response: Response): Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=users.d.ts.map