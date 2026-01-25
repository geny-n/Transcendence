import { Request } from "express";

export interface AuthentificatedRequest extends Request {
	userId? : string;
}