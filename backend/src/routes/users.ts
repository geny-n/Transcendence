import { Router } from "express";
import { authHandler, loginUser, logoutUser, registerUsers } from "../handlers/users.js";
import { checkSchema } from "express-validator";
import { loginSchema, registerUsersSchema } from "../utils/validationSchema.js";
import { authenticateToken } from "../middleware/auth.js";
import passport from "passport";

const router = Router();

router.post('/register', checkSchema(registerUsersSchema), registerUsers);
router.post('/login', checkSchema(loginSchema), loginUser);
router.get('/logout', authenticateToken, logoutUser);
router.get('/auth/42', passport.authenticate('42'));
router.get('/auth/42/callback', passport.authenticate('42', { session: false, failureRedirect: "/login" }), authHandler)
export default router;