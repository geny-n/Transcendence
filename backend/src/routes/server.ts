import { Router } from "express";
import { serverHealth, refreshTokens } from "../handlers/server.js";

const router = Router();

router.get('/health', serverHealth);
router.post('/refresh', refreshTokens);

export default router;