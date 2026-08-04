import { db } from "@/db";
import { endpoint, logs } from "@/db/schema";
import { createHmacSignature, decryptData } from "@/utils/crypto";
import { requestTracker } from "@/utils/handlers/retryHandler";
import { tryCatch } from "@/utils/handlers/tryCatch";
import { redisClient } from "@/utils/redis";
import axios from "axios";
import { Job, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { rateLimiter } from "./rateLimiter";

export async function initWorker() {
  console.log("worker initialized");
  const worker = new Worker(
    "payload-queue",
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
        endpointId: endpointRes[0].id,
        payloadId: jobFromRedis.data.payloadId,
        ip: jobFromRedis.data.ip,
      };

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
            validateStatus: () => true,
          },
        );

        responseStatus = Number(res?.data?.status ?? res?.status ?? 500);
        responseData = res?.data ?? {};

        console.log("res data", responseData);

        if (responseStatus === 200) {
          const { data: logRes, error: insertErr } = await tryCatch(
            db.insert(logs).values({
              endpointId: endpointRes[0].id,
              payloadId: jobFromRedis.data.payloadId,
              statusCode: responseStatus,
              attemptNumber: job.attemptsMade + 1,
            }),
          );

          if (insertErr) {
            throw new Error("log table insert err");
          }

          return;
        }

        const maxAttempts = job.opts.attempts ?? 3;
        if (job.attemptsMade > 0 && job.attemptsMade < maxAttempts) {
          console.log("inside the if block for retrying");
          console.log("count of attemptsMade by worker", job.attemptsMade);
          const result = await requestTracker(
            job.attemptsMade,
            data.endpointId,
            data.payloadId,
            responseStatus,
            responseData,
          );

          console.log("retry api made", result);
        }

        throw new Error(`Webhook returned status ${responseStatus}`);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          const maxAttempts = job.opts.attempts ?? 3;
          if (job.attemptsMade > 0 && job.attemptsMade < maxAttempts) {
            const result = await requestTracker(
              job.attemptsMade,
              data.endpointId,
              data.payloadId,
              Number(
                error.response?.data?.status ?? error.response?.status ?? 500,
              ),
              error.response?.data ?? {},
            );

            console.log("retry api made", result);
          }
        }

        throw error;
      }
    },
    { connection: redisClient, autorun: true },
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
