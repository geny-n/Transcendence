import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import type { Request, Response } from "express";

const gameRouter = Router();

// Check if user has an unfinished game in progress
gameRouter.get(
	"/api/game/check-unfinished",
	authenticateToken,
	asyncHandler(async (req: Request, res: Response) => {
		// This will be implemented by returning userToRoom data from the Socket handler
		// For now, this endpoint acts as a placeholder for future DB state checking
		// The actual game state is maintained in Socket.io's userToRoom map
		
		res.json({ 
			message: "Check unfinished game via Socket.io connection",
			note: "Game state is maintained in Socket.io layer"
		});
	})
);

export default gameRouter;
