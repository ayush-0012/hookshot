import { db } from "@/db";
import { endpoint } from "@/db/schema";
import { createHmacSignature, decryptData } from "@/utils/general/crypto";
import { requestTracker } from "@/utils/handlers/requestTracker";
import { tryCatch } from "@/utils/handlers/tryCatch";
import axios from "axios";
import { Job, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { rateLimiter } from "./rateLimiter";

// shared data structure for new and retry job
export type WebhookJobData = {
  body: string | Record<string, unknown> | unknown[];
  userId: string;
  payloadId: string;
  eventType: string[];
  endpointId: string;
  ip?: string;
};

// getting the endpoint related details for the worker
async function getEndpointContext(endpointId: string, userId: string) {
  const { data: endpointRes, error: fetchErr } = await tryCatch(
    db
      .select({
        id: endpoint.id,
        encryptedSigningKey: endpoint.encryptedSigningKey,
        url: endpoint.url,
      })
      .from(endpoint)
      .where(eq(endpoint.id, endpointId)),
  );

  if (fetchErr || !endpointRes?.[0]?.encryptedSigningKey) {
    throw new Error("Unable to fetch endpoint signing key for user " + userId);
  }

  return {
    id: endpointRes[0].id,
    url: endpointRes[0].url,
    signingKey: decryptData(endpointRes[0].encryptedSigningKey),
  };
}

// Shared failure classifier (was pasted in both workers).
export function classifyFailure(error: unknown) {
  if (axios.isAxiosError(error) && error.response) {
    return {
      failureCategory: "HTTP Error",
      failureReason: `HTTP ${error.response.status}`,
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    // Handling unexpected error codes and reason for better logs
    const code = (error as { code: string }).code;
    console.error("Webhook request error code:", code);
    switch (code) {
      case "ECONNREFUSED":
        return {
          failureCategory: "Connection Refused",
          failureReason:
            "Connection refused - target server is not accepting connections",
        };
      case "ENOTFOUND":
        return {
          failureCategory: "DNS Error",
          failureReason: "DNS resolution failed - hostname not found",
        };
      case "ETIMEDOUT":
        return {
          failureCategory: "Connection Timeout",
          failureReason: "Connection timed out - no response from target",
        };
      case "ECONNABORTED":
        return {
          failureCategory: "Connection Timeout",
          failureReason: "Connection timed out - no response from target",
        };
      case "ECONNRESET":
        return {
          failureCategory: "Connection Reset",
          failureReason: "Connection reset by target server",
        };
      default:
        return {
          failureCategory: "Network Error",
          failureReason: "Network error",
        };
    }
  }

  return {
    failureCategory: "Unknown Error",
    failureReason: error instanceof Error ? error.message : String(error),
  };
}

// single delivery processor for handling new and retry job
export async function processDeliveryJob(job: Job<WebhookJobData>) {
  const data = job.data;

  const signing = await getEndpointContext(data.endpointId, data.userId);
  const signature = createHmacSignature(data.body, signing.signingKey);

  if (!signing.url) {
    throw new Error("Endpoint URL missing for endpoint " + signing.id);
  }

  let res: any;
  let responseStatus = 500;
  let responseData: unknown = {};

  try {
    const rateLimit = await rateLimiter(data.ip, 10);

    if (rateLimit === 429) {
      responseStatus = 429;
      throw new Error("Rate limited");
    }

    res = await axios.post(signing.url, data.body, {
      headers: {
        "X-Webhook-Event": data.eventType,
        "X-Signature": signature,
      },
      validateStatus: () => true, // handle every status incl. 4xx/5xx (prevent axios rejection)
    });

    responseStatus = Number(res?.data?.status ?? res?.status ?? 500);
    responseData = res?.data ?? {};

    const finishedAt = new Date().toLocaleString("sv-SE");

    // success path
    if (responseStatus === 200) {
      const logInsert = await requestTracker(
        job.attemptsMade,
        data.userId,
        signing.id,
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

    // failure path — logged here, so the catch below skips it
    await requestTracker(
      job.attemptsMade,
      data.userId,
      signing.id,
      data.payloadId,
      responseStatus,
      responseData,
      "HTTP Error",
      `HTTP ${responseStatus}`,
      finishedAt,
    );

    throw new Error(`Webhook returned status ${responseStatus}`);
  } catch (error) {
    // already logged above, just rethrow for BullMQ retry accounting
    if (
      error instanceof Error &&
      error.message.startsWith("Webhook returned status ")
    ) {
      throw error;
    }

    const { failureCategory, failureReason } = classifyFailure(error);
    const finishedAt = new Date().toLocaleString("sv-SE");

    await requestTracker(
      job.attemptsMade,
      data.userId,
      signing.id,
      data.payloadId,
      responseStatus,
      responseData,
      failureCategory,
      failureReason,
      finishedAt,
    );

    throw error;
  }
}

// Shared BullMQ lifecycle listeners; label keeps payload/retry logs distinct.
export function attachWorkerListeners(worker: Worker, label: string) {
  worker.on("active", (job) =>
    console.log(`[${label}] Job ${job.id} is now active.`),
  );
  worker.on("progress", (job, progress) =>
    console.log(`[${label}] Job ${job.id} progress:`, progress),
  );
  worker.on("stalled", (jobId, prevState) =>
    console.warn(
      `[${label}] Job ${jobId} stalled. Previous state: ${prevState}. BullMQ will re-queue it.`,
    ),
  );
  worker.on("completed", (job) =>
    console.log(`[${label}] Job ${job.id} completed.`),
  );
  worker.on("failed", (job, err) =>
    console.error(`[${label}] Job ${job?.id} failed:`, err.message),
  );
  worker.on("error", (err) => console.error(`[${label}] Worker error:`, err));
  worker.on("drained", () => console.log(`[${label}] Queue drained.`));
  worker.on("paused", () => console.log(`[${label}] Worker paused.`));
  worker.on("resumed", () => console.log(`[${label}] Worker resumed.`));
  worker.on("closed", async () => console.log(`[${label}] Worker closed.`));
}
