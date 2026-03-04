import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getChat} from "../handlers/chat.js";

const router = Router();

router.get('/users/chat/:friendId', authenticateToken, getChat);

export default router;