import { Router } from "express";
import { authHandler, loginUser, logoutUser, registerUsers } from "../handlers/authentification.js";
import { checkSchema } from "express-validator";
import { loginSchema, registerUsersSchema } from "../utils/validationSchema.js";
import { authenticateToken } from "../middleware/auth.js";
import passport from "passport";
import { authLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../utils/asyncHandlers.js";

const router = Router();

router.post('/register', authLimiter, checkSchema(registerUsersSchema), registerUsers);
router.post('/login', authLimiter, checkSchema(loginSchema), loginUser);
router.get('/logout', authenticateToken, logoutUser);
router.get('/auth/42', authLimiter, passport.authenticate('42'));
router.get('/auth/42/callback', passport.authenticate('42', { session: false, failureRedirect: "/login" }), authHandler)
export default router;