import { db } from "@/db";
import { logs } from "@/db/schema";
import { tryCatch } from "./tryCatch";

// it will track the jobs status and store the data for that in the db
export async function retriesTracker(
  attemptsMade: number,
  endpointId: string,
  payloadId: string,
  statusCode: number,
  endpointRes: unknown,
) {
  console.log("db call to save in logs");
  const endpointResponse =
    typeof endpointRes === "string"
      ? endpointRes
      : JSON.stringify(endpointRes ?? {});

  const { data: logsInsert, error: insertErr } = await tryCatch(
    db
      .insert(logs)
      .values({
        endpointId,
        payloadId,
        statusCode,
        attemptNumber: attemptsMade + 1,
        endpointResponse,
      })
      .returning(),
  );

  if (logsInsert) console.log("logs insert in db", logsInsert);
  else console.log("logs insert err", insertErr);

  return logsInsert;
}
