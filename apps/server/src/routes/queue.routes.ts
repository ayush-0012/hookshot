import { ingestion } from "@/controllers/ingestion.controller";
import { Router } from "express";

export const router: Router = Router();

router.post("/ingestion", ingestion);

export const queueRoutes = router;
