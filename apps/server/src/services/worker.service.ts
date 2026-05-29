import { redisClient } from "@/utils/redis";
import { Job, Worker } from "bullmq";

export function testingWorker() {
  const worker = new Worker(
    "payload-queue",
    async (job: Job) => {
      // here the job, which is our payload, will be resolved
      // await resolveEndpoint()
      const jobFromRedis = job;

      console.log("worker", worker);
      // we can get whatever data we stored in redis and queued .id/.data etc
      console.log("getting the job from redis", jobFromRedis.data);

      return jobFromRedis;
      // in the job, we'll be having the payload and the endpoint, and in the worker, we'll be resolving that
      // we have to think about the edge cases while the worker is in progress
    },
    { connection: redisClient },
  );

  return worker;
}
