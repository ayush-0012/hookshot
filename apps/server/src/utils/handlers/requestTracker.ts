import { db } from "@/db";
import { logs } from "@/db/schema";
import { tryCatch } from "./tryCatch";

// it will track the jobs status and store the data for that in the db
export async function requestTracker(
  attemptsMade: number,
  userId: string,
  endpointId: string,
  payloadId: string,
  statusCode: number,
  endpointRes: unknown,
  failureCategory?: string,
  failureReason?: string,
) {
  console.log("db call to save in logs");
  const endpointResponse =
    typeof endpointRes === "string"
      ? endpointRes
      : JSON.stringify(endpointRes ?? {});
  const startedAt = new Date().toISOString();

  const { data: logsInsert, error: insertErr } = await tryCatch(
    db
      .insert(logs)
      .values({
        userId,
        endpointId,
        payloadId,
        statusCode,
        attemptNumber: attemptsMade + 1,
        endpointResponse,
        failureCategory,
        failureReason,
        startedAt,
      })
      .returning(),
  );

  if (logsInsert) console.log("logs insert in db", logsInsert);
  else console.log("logs insert err", insertErr);

  return logsInsert;
}
