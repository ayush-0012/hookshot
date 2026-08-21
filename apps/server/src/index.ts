import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import { env } from "./env";
import { validateApiKey } from "./middlewares/auth.middleware";
import { apiKeyRoutes } from "./routes/apiKey.routes";
import { endpointRoutes } from "./routes/endpoint.routes";
import { queueRoutes } from "./routes/queue.routes";
import { userRoutes } from "./routes/user.routes";
import { rateLimiterMiddleware } from "./services/rateLimiter";
import { initWorker } from "./services/worker.service";

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

app.use("/api/user", userRoutes);
app.use("/api/key", apiKeyRoutes);
app.use("/api/endpoint", endpointRoutes);
app.use("/api/queue", rateLimiterMiddleware, validateApiKey, queueRoutes);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
