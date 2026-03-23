import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { checkSchema } from "express-validator";
import { friendActionSchema, friendRequestSchema } from "../utils/validationSchema.js";
import { friendRequestAction, getFriendList, getPendingRequests, sendFriendRequest, unfriend } from "../handlers/friends.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { roleGuard } from "../middleware/roleGuard.js";

const router = Router();

router.post('/friends/requests', authLimiter, authenticateToken, roleGuard(['USER', 'ADMIN']), checkSchema(friendRequestSchema)
	, sendFriendRequest);
router.patch('/friends/requests/:id', authenticateToken, roleGuard(['USER', 'ADMIN']), checkSchema(friendActionSchema)
	, friendRequestAction);
router.get('/friends', authenticateToken, roleGuard(['USER', 'ADMIN']), getFriendList);
router.get('/friends/pending', authenticateToken, roleGuard(['USER', 'ADMIN']), getPendingRequests);
router.delete('/friends/:id', authenticateToken, roleGuard(['USER', 'ADMIN']), unfriend);

export default router;