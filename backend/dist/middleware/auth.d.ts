import { NextFunction, Response } from "express";
import { AuthentificatedRequest } from "../dtos/AuthenticatedRequest.dto";
export declare function authenticateToken(request: AuthentificatedRequest, response: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.d.ts.map