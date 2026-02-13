import type { NextFunction, Request, Response } from "express";

export const errorHandler = (err:any, req:Request, res:Response, next:NextFunction) => {
    console.error(err);
    res.status(500).json({
        success:false,
        message: process.env.NODE_ENV === 'production' ? "Internal server error" : err.message
    });
}