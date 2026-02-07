import { Router } from "express";
import usersRouter from './users.js';
import serverRouter from './server.js';
import chatRouter from './chat.js';

const router = Router();

router.use(usersRouter);
router.use(serverRouter);
router.use(chatRouter);

export default router;