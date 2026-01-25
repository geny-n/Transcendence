import { Router } from "express";
import usersRouter from './users';
import serverRouter from './server';

const router = Router();

router.use(usersRouter);
router.use(serverRouter);

export default router;