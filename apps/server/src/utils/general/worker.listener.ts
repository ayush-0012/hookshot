// export function workerListeners(worker, job) {
//   worker.on("active", (job) => console.log(`Job ${job.id} is now active.`));
//   worker.on("progress", (job, progress) =>
//     console.log(`Job ${job.id} progress:`, progress),
//   );
//   worker.on("stalled", (jobId, prevState) =>
//     console.warn(
//       `Job ${jobId} stalled. Previous state: ${prevState}. BullMQ will re-queue it.`,
//     ),
//   );
//   worker.on("completed", (job) => console.log(`Job ${job.id} completed.`));
//   worker.on("failed", (job, err) =>
//     console.error(`Job ${job?.id} failed:`, err.message),
//   );
//   worker.on("error", (err) => console.error("Worker error:", err));
//   worker.on("drained", () => console.log("Queue drained."));
//   worker.on("paused", () => console.log("Worker paused."));
//   worker.on("resumed", () => console.log("Worker resumed."));
//   worker.on("closed", async () => console.log("Worker closed."));
// }
