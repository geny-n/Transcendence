import { Router } from "express";
import usersRouter from './users.js';
import serverRouter from './server.js';

const router = Router();

router.use(usersRouter);
router.use(serverRouter);

export default router;