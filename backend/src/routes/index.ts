import { Router } from "express";
import usersRouter from './authentification.js';
import userProfile from './user_profile.js'
import serverRouter from './server.js';
import friendRouter from './friends.js'
import adminRouter from './admin.js'

const router = Router();

router.use(usersRouter);
router.use(serverRouter);
router.use(userProfile);
router.use(friendRouter);
router.use(adminRouter);

export default router;