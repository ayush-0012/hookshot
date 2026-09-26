import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import { env } from "./env";
import { validateApiKey } from "./middlewares/auth.middleware";
import { requireAuth } from "./middlewares/clerk.middleware";
import { apiKeyRoutes } from "./routes/apiKey.routes";
import { endpointRoutes } from "./routes/endpoint.routes";
import { queueRoutes } from "./routes/queue.routes";
import { retryRoutes } from "./routes/retry.routes";
import { userRoutes } from "./routes/user.routes";
import { rateLimiterMiddleware } from "./services/rateLimiter";
import { initWorker } from "./services/worker.service";
import { errorHandler, notFoundHandler } from "./utils/handlers/responseHandler";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// app.options("*");

console.log("cors url :", process.env.CORS_ORIGIN);

app.use(clerkMiddleware());

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

initWorker();

app.use("/api/user", requireAuth, userRoutes);
app.use("/api/key", requireAuth, apiKeyRoutes);
app.use("/api/endpoint", requireAuth, endpointRoutes);
app.use("/api/retry", requireAuth, retryRoutes);
app.use("/api/queue", rateLimiterMiddleware, validateApiKey, queueRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
