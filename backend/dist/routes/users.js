import { Router } from "express";
import { loginUser, logoutUser, registerUsers } from "../handlers/users";
import { checkSchema } from "express-validator";
import { loginSchema, registerUsersSchema } from "../utils/validationSchema";
import { authenticateToken } from "../middleware/auth";
const router = Router();
router.post('/register', checkSchema(registerUsersSchema), registerUsers);
router.post('/login', checkSchema(loginSchema), loginUser);
router.get('/logout', authenticateToken, logoutUser);
export default router;
//# sourceMappingURL=users.js.map