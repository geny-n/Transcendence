import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { changeUserRole, deleteUser, getUserByUsernameOrId, listAllUsers, updateUser } from "../handlers/admin.js";
import { checkSchema } from "express-validator";
import { updateUserAdminSchema } from "../utils/validationSchema.js";
import { resizeAvatar, upload } from "../middleware/upload.js";

const router = Router();

router.get('/admin', authenticateToken, roleGuard(['ADMIN', 'MODERATOR']), listAllUsers);
router.get('/admin/:search', authenticateToken, roleGuard(['ADMIN', 'MODERATOR']), getUserByUsernameOrId);
router.put('/admin/:id', authenticateToken, roleGuard(['ADMIN', 'MODERATOR']), checkSchema(updateUserAdminSchema)
	, upload.single('avatar'), resizeAvatar, updateUser);
router.delete('/admin/:id', authenticateToken, roleGuard(['ADMIN']), deleteUser);
router.patch('/admin/:id/role', authenticateToken, roleGuard(['ADMIN']), changeUserRole);

export default router;