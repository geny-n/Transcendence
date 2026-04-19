import type { NextFunction, Request, Response } from "express";

export const asyncHandler = (fn: Function) => (req:Request, res:Response, next:NextFunction) =>
		Promise.resolve(fn(req, res, next)).catch(next);

export const errorHandler = (handler: Function) => {
	const handleError = (err: any) => {
		console.error("please handle me", err);
	};

	return (...args:any) => {
		try {
			const ret = handler.apply(this, args);
			if (ret && typeof ret.catch === "function") {
				// async handler
				ret.catch(handleError);
			}
		} catch (e) {
			// sync handler
			handleError(e);
		}
	};
};