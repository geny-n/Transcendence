import { Router } from "express";
import { authHandler, loginUser, logoutUser, registerUsers } from "../handlers/users";
import { checkSchema } from "express-validator";
import { loginSchema, registerUsersSchema } from "../utils/validationSchema";
import { authenticateToken } from "../middleware/auth";
import passport from "passport";

const router = Router();

router.post('/register', checkSchema(registerUsersSchema), registerUsers);
router.post('/login', checkSchema(loginSchema), loginUser);
router.get('/logout', authenticateToken, logoutUser);
router.get('/auth/42', passport.authenticate('42'));
router.get('/auth/42/callback', passport.authenticate('42', { session: false, failureRedirect: "/login" }), authHandler)
export default router;