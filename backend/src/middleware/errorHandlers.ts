import type { NextFunction, Request, Response } from "express";

export const errorHandler = (err:any, req:Request, res:Response, next:NextFunction) => {
    console.error(err);
    const fallbackMessage = "backend.common.internal.server.error";
    const message = typeof err?.message === 'string' && err.message.length > 0 ? err.message : fallbackMessage;
    res.status(500).json({
        success:false,
        message: process.env.NODE_ENV === 'production' ? fallbackMessage : message
    });
}