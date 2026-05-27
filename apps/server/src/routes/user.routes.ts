import { insertUser } from "@/controllers/auth.controller";
import { Router } from "express";

export const router: Router = Router();

router.post("/insert", insertUser);

export const userRoutes = router;
