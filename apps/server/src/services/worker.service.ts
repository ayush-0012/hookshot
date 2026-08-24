import { db } from "@/db";
import { endpoint } from "@/db/schema";
import { queue } from "@/utils/constants";
import { createHmacSignature, decryptData } from "@/utils/general/crypto";
import { requestTracker } from "@/utils/handlers/requestTracker";
import { tryCatch } from "@/utils/handlers/tryCatch";
import { redisClient } from "@/utils/redis";
import axios from "axios";
import { Job, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { rateLimiter } from "./rateLimiter";

export async function initWorker() {
  console.log("worker initialized");
  const worker = new Worker(
    queue,
    async (job: Job) => {
      const jobFromRedis = job;

      // db call to get the signing key of the user
      const { data: endpointRes, error: fetchErr } = await tryCatch(
        db
          .select({
            id: endpoint.id,
            encryptedSigningKey: endpoint.encryptedSigningKey,
            url: endpoint.url,
          })
          .from(endpoint)
          .where(eq(endpoint.id, jobFromRedis.data.endpointId)),
      );

      console.log({ endpointRes, fetchErr });

      if (fetchErr || !endpointRes?.[0]?.encryptedSigningKey) {
        throw new Error(
          "Unable to fetch endpoint signing key for user " +
            jobFromRedis.data.userId,
        );
      }

      console.log("getting signing key");
      const signingKey = decryptData(endpointRes[0].encryptedSigningKey);
      const signature = createHmacSignature(jobFromRedis.data.body, signingKey);
      const endpointUrl = endpointRes[0].url;

      const data = {
        signature: JSON.stringify(signature),
        endpointUrl: endpointRes[0].url,
        eventType: jobFromRedis.data.eventType,
        payloadBody: jobFromRedis.data.body,
        userId: jobFromRedis.data.userId,
        endpointId: endpointRes[0].id,
        payloadId: jobFromRedis.data.payloadId,
        ip: jobFromRedis.data.ip,
      };

      console.log("inside the worker loggin userid", data.userId);

      console.log("making api call");
      let res: any;
      let responseStatus = 500;
      let responseData: unknown = {};

      try {
        const rateLimit = await rateLimiter(data.ip, 10);
        console.log(
          "rate limiter result",
          rateLimit,
          "attempt",
          job.attemptsMade + 1,
        );

        if (rateLimit === 429) {
          responseStatus = 429;
          throw new Error("Rate limited");
        }

        res = await axios.post(
          `http://localhost:4000/webhook`, // hardcoded for now
          data.payloadBody,
          {
            headers: {
              "X-Webhook-Event": data.eventType,
              "X-Signature": data.signature,
            },
            validateStatus: () => true, // for handling every request including 4xx, 5xx (To prevent rejection from axios)
          },
        );

        responseStatus = Number(res?.data?.status ?? res?.status ?? 500);
        responseData = res?.data ?? {};

        console.log("res data", responseData);

        // runs if api returned success
        if (responseStatus === 200) {
          // tracking 200 as well using the helper function
          const finishedAt = new Date().toLocaleString("sv-SE");
          const logInsert = await requestTracker(
            job.attemptsMade,
            data.userId,
            data.endpointId,
            data.payloadId,
            responseStatus,
            responseData,
            "",
            "",
            finishedAt,
          );

          if (!logInsert) {
            throw new Error("log table insert err");
          }

          return;
        }

        // runs on retry if the api calls has failed
        const maxAttempts = job.opts.attempts ?? 3;
        if (job.attemptsMade > 0 && job.attemptsMade < maxAttempts) {
          console.log("inside the if block for retrying");
          console.log("count of attemptsMade by worker", job.attemptsMade);
          const finishedAt = new Date().toLocaleString("sv-SE");
          const result = await requestTracker(
            job.attemptsMade,
            data.userId,
            data.endpointId,
            data.payloadId,
            responseStatus,
            responseData,
            "HTTP Error",
            `HTTP ${responseStatus}`,
            finishedAt,
          );

          console.log("retry api made", result);
        }

        throw new Error(`Webhook returned status ${responseStatus}`);
      } catch (error) {
        let failureCategory: string;
        let failureReason: string;

        if (axios.isAxiosError(error) && error.response) {
          failureCategory = "HTTP Error";
          failureReason = `HTTP ${error.response.status}`;
        } else if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof error.code === "string"
        ) {
          // Handling unexpected error codes and reason for better logs
          console.error("Webhook request error code:", error.code);
          switch (error.code) {
            case "ECONNREFUSED":
              failureCategory = "Connection Refused";
              failureReason =
                "Connection refused - target server is not accepting connections";
              break;
            case "ENOTFOUND":
              failureCategory = "DNS Error";
              failureReason = "DNS resolution failed - hostname not found";
              break;
            case "ETIMEDOUT":
              failureCategory = "Connection Timeout";
              failureReason = "Connection timed out - no response from target";
              break;
            case "ECONNABORTED":
              failureCategory = "Connection Timeout";
              failureReason = "Connection timed out - no response from target";
              break;
            case "ECONNRESET":
              failureCategory = "Connection Reset";
              failureReason = "Connection reset by target server";
              break;
            default:
              failureCategory = "Network Error";
              failureReason = "Network error";
          }
        } else {
          failureCategory = "Unknown Error";
          failureReason =
            error instanceof Error ? error.message : String(error);
        }

        if (axios.isAxiosError(error) && error.response) {
          const maxAttempts = job.opts.attempts ?? 3;
          if (job.attemptsMade > 0 && job.attemptsMade < maxAttempts) {
            const finishedAt = new Date().toLocaleString("sv-SE");
            const result = await requestTracker(
              job.attemptsMade,
              data.userId,
              data.endpointId,
              data.payloadId,
              Number(
                error.response?.data?.status ?? error.response?.status ?? 500,
              ),
              error.response?.data ?? {},
              failureCategory,
              failureReason,
              finishedAt,
            );

            console.log("retry api made", result);
          }
        } else if (
          !(
            error instanceof Error &&
            error.message.startsWith("Webhook returned status ")
          )
        ) {
          const finishedAt = new Date().toLocaleString("sv-SE");
          const result = await requestTracker(
            job.attemptsMade,
            data.userId,
            data.endpointId,
            data.payloadId,
            responseStatus,
            responseData,
            failureCategory,
            failureReason,
            finishedAt,
          );

          console.log("failure logged", result);
        }

        throw error;
      }
    },
    { connection: redisClient, autorun: true },
  );

  console.log("retryWorker init");
  // worker to process jobs, users trying to retry from dashboard
  const retryWorker = new Worker(
    queue,
    async (job: Job) => {
      const jobFromRedis = job;

      // db call to get the signing key of the user
      const { data: endpointRes, error: fetchErr } = await tryCatch(
        db
          .select({
            id: endpoint.id,
            encryptedSigningKey: endpoint.encryptedSigningKey,
            url: endpoint.url,
          })
          .from(endpoint)
          .where(eq(endpoint.id, jobFromRedis.data.endpointId)),
      );

      console.log({ endpointRes, fetchErr });

      if (fetchErr || !endpointRes?.[0]?.encryptedSigningKey) {
        throw new Error(
          "Unable to fetch endpoint signing key for user " +
            jobFromRedis.data.userId,
        );
      }

      console.log("getting signing key");
      const signingKey = decryptData(endpointRes[0].encryptedSigningKey);
      const signature = createHmacSignature(jobFromRedis.data.body, signingKey);

      const data = {
        signature: JSON.stringify(signature),
        endpointUrl: endpointRes[0].url,
        eventType: jobFromRedis.data.eventType,
        payloadBody: jobFromRedis.data.body,
        userId: jobFromRedis.data.userId,
        endpointId: endpointRes[0].id,
        payloadId: jobFromRedis.data.payloadId,
        ip: jobFromRedis.data.ip,
      };

      console.log("inside the retryworker loggin userid", data.userId);

      console.log("making api call");
      let res: any;
      let responseStatus = 500;
      let responseData: unknown = {};

      try {
        const rateLimit = await rateLimiter(data.ip, 10);
        console.log(
          "rate limiter result",
          rateLimit,
          "attempt",
          job.attemptsMade + 1,
        );

        if (rateLimit === 429) {
          responseStatus = 429;
          throw new Error("Rate limited");
        }

        res = await axios.post(
          `http://localhost:4000/webhook`, // hardcoded for now
          data.payloadBody,
          {
            headers: {
              "X-Webhook-Event": data.eventType,
              "X-Signature": data.signature,
            },
            validateStatus: () => true, // for handling every request including 4xx, 5xx (To prevent rejection from axios)
          },
        );

        responseStatus = Number(res?.data?.status ?? res?.status ?? 500);
        responseData = res?.data ?? {};

        console.log("res data", responseData);

        if (responseStatus === 200) {
          const finishedAt = new Date().toLocaleString("sv-SE");
          const logInsert = await requestTracker(
            job.attemptsMade,
            data.userId,
            data.endpointId,
            data.payloadId,
            responseStatus,
            responseData,
            undefined,
            undefined,
            finishedAt,
          );

          if (!logInsert) {
            throw new Error("log table insert err");
          }

          return;
        }

        // don't need to handle retry since user is already retrying this job from the dashboard
        const finishedAt = new Date().toLocaleString("sv-SE");
        const result = await requestTracker(
          job.attemptsMade,
          data.userId,
          data.endpointId,
          data.payloadId,
          responseStatus,
          responseData,
          "HTTP Error",
          `HTTP ${responseStatus}`,
          finishedAt,
        );

        throw new Error(`Webhook returned status ${responseStatus}`);
      } catch (error) {
        let failureCategory: string;
        let failureReason: string;
        const finishedAt = new Date().toLocaleString("sv-SE");

        if (axios.isAxiosError(error) && error.response) {
          failureCategory = "HTTP Error";
          failureReason = `HTTP ${error.response.status}`;
        } else if (
          error instanceof Error &&
          error.message.startsWith("Webhook returned status ")
        ) {
          failureCategory = "HTTP Error";
          failureReason = error.message.replace(
            "Webhook returned status ",
            "HTTP ",
          );
        } else if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof error.code === "string"
        ) {
          console.error("Webhook request error code:", error.code);
          switch (error.code) {
            case "ECONNREFUSED":
              failureCategory = "Connection Refused";
              failureReason =
                "Connection refused - target server is not accepting connections";
              break;
            case "ENOTFOUND":
              failureCategory = "DNS Error";
              failureReason = "DNS resolution failed - hostname not found";
              break;
            case "ETIMEDOUT":
              failureCategory = "Connection Timeout";
              failureReason = "Connection timed out - no response from target";
              break;
            case "ECONNABORTED":
              failureCategory = "Connection Timeout";
              failureReason = "Connection timed out - no response from target";
              break;
            case "ECONNRESET":
              failureCategory = "Connection Reset";
              failureReason = "Connection reset by target server";
              break;
            default:
              failureCategory = "Network Error";
              failureReason = "Network error";
          }
        } else {
          failureCategory = "Unknown Error";
          failureReason =
            error instanceof Error ? error.message : String(error);
        }

        if (axios.isAxiosError(error) && error.response) {
          const result = await requestTracker(
            job.attemptsMade,
            data.userId,
            data.endpointId,
            data.payloadId,
            Number(
              error.response?.data?.status ?? error.response?.status ?? 500,
            ),
            error.response?.data ?? {},
            failureCategory,
            failureReason,
            finishedAt,
          );

          console.log("retry api made", result);
        } else if (
          !(
            error instanceof Error &&
            error.message.startsWith("Webhook returned status ")
          )
        ) {
          const result = await requestTracker(
            job.attemptsMade,
            data.userId,
            data.endpointId,
            data.payloadId,
            responseStatus,
            responseData,
            failureCategory,
            failureReason,
            finishedAt,
          );

          console.log("failure logged", result);
        }

        throw error;
      }
    },
    {
      connection: redisClient,
      autorun: false,
    },
  );

  worker.on("active", (job) => console.log(`Job ${job.id} is now active.`));
  worker.on("progress", (job, progress) =>
    console.log(`Job ${job.id} progress:`, progress),
  );
  worker.on("stalled", (jobId, prevState) =>
    console.warn(
      `Job ${jobId} stalled. Previous state: ${prevState}. BullMQ will re-queue it.`,
    ),
  );
  worker.on("completed", (job) => console.log(`Job ${job.id} completed.`));
  worker.on("failed", (job, err) =>
    console.error(`Job ${job?.id} failed:`, err.message),
  );
  worker.on("error", (err) => console.error("Worker error:", err));
  worker.on("drained", () => console.log("Queue drained."));
  worker.on("paused", () => console.log("Worker paused."));
  worker.on("resumed", () => console.log("Worker resumed."));
  worker.on("closed", async () => console.log("Worker closed."));
}
