import {
  createUserEndpoint,
  fetchUserWebhooks,
} from "@/controllers/endpoint.controller";
import { Router } from "express";

export const router: Router = Router();

router.post("/create", createUserEndpoint);
router.get("/webhooks", fetchUserWebhooks);

export const endpointRoutes = router;
