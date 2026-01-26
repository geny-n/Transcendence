import { Router } from "express";
import { serverHealth, refreshTokens } from "../handlers/server";

const router = Router();

router.get('/health', serverHealth);
router.post('/refresh', refreshTokens);

export default router;