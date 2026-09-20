// wrapper class, published as an npm package to interact with the service
import { createHmac, timingSafeEqual } from "node:crypto";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

export type JsonObject = {
  [key: string]: JsonValue;
};

export type HookshotOptions = {
  debug?: boolean;
  timeoutMs?: number;
};

export type IngestResult = {
  message: string;
  jobIngestion: unknown;
};

export class Hookshot {
  private readonly apiKey: string;
  private readonly debug: boolean;
  private readonly timeoutMs: number;

  constructor(apiKey: string, opts?: HookshotOptions) {
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      throw new Error(JSON.stringify({ errors: ["API key is missing"] }));
    }
    this.apiKey = apiKey;
    this.debug = opts?.debug ?? false;
    this.timeoutMs = opts?.timeoutMs ?? 10000;
  }

  async ingest(
    endpointId: string,
    payloadBody: JsonObject,
    eventType: string[],
  ): Promise<IngestResult> {
    const errors: string[] = [];

    if (!endpointId || typeof endpointId !== "string" || endpointId.trim() === "") {
      errors.push("EndpointId is missing");
    }

    if (
      !Array.isArray(eventType) ||
      eventType.length === 0 ||
      !eventType.every((e) => typeof e === "string" && e.trim() !== "")
    ) {
      errors.push("Event type is missing");
    }

    if (
      !payloadBody ||
      typeof payloadBody !== "object" ||
      Array.isArray(payloadBody)
    ) {
      errors.push("Payload data is missing");
    } else {
      try {
        JSON.stringify(payloadBody);
      } catch {
        errors.push("Payload data is not JSON serializable");
      }
    }

    if (errors.length > 0) {
      throw new Error(JSON.stringify({ errors }));
    }

    if (this.debug) {
      console.log("Hookshot ingest payload:", {
        endpointId,
        eventType,
      });
    }

    // fetch api call to the ingestion api, becuase this method will be used from someone else's service
    // can't import and invoke the ingestion like that

    try {
      const response = await fetch(
        "http://localhost:3000/api/queue/ingestion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payloadBody,
            eventType,
            endpointId,
            apiKey: this.apiKey,
          }),
          signal: AbortSignal.timeout(this.timeoutMs),
        },
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Request failed with status ${response.status}: ${errorText}`,
        );
      }

      const jobIngestion = await response.json().catch(() => null);

      if (this.debug) {
        console.log("ingestion method invoked", jobIngestion);
      }

      return {
        message: "Your request has been added to the job",
        jobIngestion,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to ingest your request, please try again";

      throw new Error(message);
    }
  }

  verifySignature(
    payload: JsonObject | string,
    signatureHeader: string,
    signingSecret: string,
  ): boolean {
    if (!signatureHeader || !signingSecret || payload === undefined) {
      throw new Error(
        JSON.stringify({ errors: ["signature, secret and payload are required"] }),
      );
    }

    // Match server: crypto.ts createHmacSignature() does
    // HMAC_SHA256(JSON.stringify(body), decryptedSigningKey) hex digest.
    // Worker sends it via JSON.stringify(signature), so strip surrounding quotes.
    let received = signatureHeader.trim();
    if (received.length >= 2 && received.startsWith('"') && received.endsWith('"')) {
      try {
        received = JSON.parse(received);
      } catch {
        // keep raw value, comparison below will fail safely
      }
    }
    // Allow "v1=hex" style prefixes if added later
    if (received.includes("=")) {
      received = received.split("=").pop() as string;
    }

    const data = typeof payload === "string" ? payload : JSON.stringify(payload);
    const expectedHex = createHmac("sha256", signingSecret).update(data).digest("hex");

    const a = Buffer.from(received, "utf8");
    const b = Buffer.from(expectedHex, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
