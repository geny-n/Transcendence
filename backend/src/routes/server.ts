import { Router } from "express";
import { serverHealth, refreshTokens } from "../handlers/server.js";

const router = Router();

router.get('/health', serverHealth);
router.get('/refresh', refreshTokens);

export default router;