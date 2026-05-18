import { Job, Worker } from "bullmq";

const worker = new Worker("paylaod-queue", async (job: Job) => {
  // here the job, which is our payload, will be resolved
  try {
    // await resolveEndpoint()
    // in the job, we'll be having the payload and the endpoint, and in the worker, we'll be resolving that
    // we have to think about the edge cases while the worker is in progress
  } catch (error) {}
});
