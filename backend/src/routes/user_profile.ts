import { Router } from "express";
import { changeAvatar, changePassword, getMyProfile, searchUser, updateMyProfile } from "../handlers/user_profile.js";
import { checkSchema } from "express-validator";
import { changePasswordSchema, updateProfileSchema } from "../utils/validationSchema.js";
import { authenticateToken } from "../middleware/auth.js";
import { resizeAvatar, upload } from "../middleware/upload.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get('/users/me', authenticateToken, getMyProfile);
router.put('/users/me', authenticateToken, checkSchema(updateProfileSchema), updateMyProfile);
router.post('/users/me/password', authenticateToken, checkSchema(changePasswordSchema), changePassword);
router.put('/users/me/avatar', authenticateToken, upload.single('avatar'), resizeAvatar, changeAvatar);
router.get('/users/search', authLimiter, authenticateToken, searchUser);

export default router;