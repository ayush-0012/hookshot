import { queue, retryQueue } from "@/utils/constants";
import { redisClient } from "@/utils/redis";
import { Worker } from "bullmq";
import { attachWorkerListeners, processDeliveryJob } from "./webhookDelivery";

export async function initWorker() {
  console.log("worker initialized");
  const worker = new Worker(queue, processDeliveryJob, {
    connection: redisClient,
    autorun: true,
  });

  console.log("retryWorker init");
  const retryWorker = new Worker(retryQueue, processDeliveryJob, {
    connection: redisClient,
    autorun: true,
  });

  attachWorkerListeners(worker, "payload");
  attachWorkerListeners(retryWorker, "retry");
}
