import { Router } from "express";
import { serverHealth } from "../handlers/server";

const router = Router();

router.get('/health', serverHealth);
router.post('/refresh');

export default router;