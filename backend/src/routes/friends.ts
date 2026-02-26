import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { checkSchema } from "express-validator";
import { friendActionSchema, friendRequestSchema } from "../utils/validationSchema.js";
import { friendRequestAction, getFriendList, getPendingRequests, sendFriendRequest, unfriend } from "../handlers/friends.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { roleGuard } from "../middleware/roleGuard.js";

const router = Router();

router.post('/friends/requests', authLimiter, authenticateToken, roleGuard(['USER']), checkSchema(friendRequestSchema)
	, sendFriendRequest);
router.patch('/friends/requests/:id', authenticateToken, roleGuard(['USER']), checkSchema(friendActionSchema)
	, friendRequestAction);
router.get('/friends', authenticateToken, roleGuard(['USER']), getFriendList);
router.get('/friends/pending', authenticateToken, roleGuard(['USER']), getPendingRequests);
router.delete('/friends/:id', authenticateToken, roleGuard(['USER']), unfriend);

export default router;