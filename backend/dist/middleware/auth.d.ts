import type { NextFunction, Response } from "express";
import type { AuthentificatedRequest } from "../dtos/AuthenticatedRequest.dto.js";
export declare function authenticateToken(request: AuthentificatedRequest, response: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.d.ts.map