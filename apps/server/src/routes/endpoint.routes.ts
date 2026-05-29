import { createUserEndpoint } from "@/controllers/endpoint.controller";
import { Router } from "express";

export const router: Router = Router();

router.post("/create", createUserEndpoint);

export const endpointRoutes = router;
