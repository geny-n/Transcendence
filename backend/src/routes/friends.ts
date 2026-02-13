import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { checkSchema } from "express-validator";
import { friendActionSchema, friendRequestSchema } from "../utils/validationSchema.js";
import { friendRequestAction, getFriendList, getPendingRequests, sendFriendRequest, unfriend } from "../handlers/friends.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post('/friends/requests', authLimiter, authenticateToken, checkSchema(friendRequestSchema), sendFriendRequest);
router.patch('/friends/requests/:id', authenticateToken, checkSchema(friendActionSchema), friendRequestAction);
router.get('/friends', authenticateToken, getFriendList);
router.get('/friends/pending', authenticateToken, getPendingRequests);
router.delete('/friends/:id', authenticateToken, unfriend);

export default router;