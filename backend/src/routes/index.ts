import { Router } from "express";
import usersRouter from './authentification.js';
import userProfile from './user_profile.js'
import serverRouter from './server.js';
import friendRouter from './friends.js'
import adminRouter from './admin.js'
import chatRouter from './chat.js'
import scoreboardRouter from './scoreboard.js'

const router = Router();

router.use(usersRouter);
router.use(serverRouter);
router.use(userProfile);
router.use(friendRouter);
router.use(adminRouter);
router.use(chatRouter);
router.use(scoreboardRouter);

export default router;