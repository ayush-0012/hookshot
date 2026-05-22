import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import { insertUser } from "./controllers/auth.controller";
import { env } from "./env";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// app.options("*");

console.log("cors url :", process.env.CORS_ORIGIN);

app.use(clerkMiddleware());

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.post("/auth", insertUser);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
