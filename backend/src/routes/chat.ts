import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getChat, markAsRead } from "../handlers/chat.js";

const router = Router();

router.get('/users/chat/:friendId', authenticateToken, getChat);
router.patch('/users/chat/:friendId/read', authenticateToken, markAsRead);

export default router;