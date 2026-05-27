import { createApiKey, getApiKeys } from "@/controllers/apiKey.controller";
import { Router } from "express";

export const router: Router = Router();

router.post("/create", createApiKey);
router.post("/list", getApiKeys);

export const apiKeyRoutes = router;
