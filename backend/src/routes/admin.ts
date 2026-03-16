import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { changeUserRole, deleteUser, listAllUsers, updateUser } from "../handlers/admin.js";
import { checkSchema } from "express-validator";
import { changeUserRoleAdminSchema, updateUserAdminSchema } from "../utils/validationSchema.js";
import { resizeAvatar, upload } from "../middleware/upload.js";

const router = Router();

router.get('/admin/users', authenticateToken, roleGuard(['ADMIN']), listAllUsers);
router.put('/admin/users/:id', authenticateToken, roleGuard(['ADMIN']), upload.single('avatar'), checkSchema(updateUserAdminSchema), resizeAvatar, updateUser);
router.delete('/admin/users/:id', authenticateToken, roleGuard(['ADMIN']), deleteUser);
router.patch('/admin/users/:id/role', authenticateToken, roleGuard(['ADMIN']), checkSchema(changeUserRoleAdminSchema), changeUserRole);

export default router;