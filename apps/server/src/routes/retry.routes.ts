import { retryJob } from "@/controllers/ingestion.controller";
import { Router } from "express";

export const router: Router = Router();

// Dashboard manual retries (user session auth, applied in index.ts).
// Kept off /api/queue so validateApiKey's machine-auth shape doesn't apply.
router.post("/", retryJob);

export const retryRoutes = router;
