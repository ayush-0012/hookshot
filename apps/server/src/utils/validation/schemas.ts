import { z } from "zod";

const endpointUrlSchema = z
  .string()
  .trim()
  .url("Endpoint URL must be a valid URL")
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return (
        ["http:", "https:"].includes(parsed.protocol) &&
        !parsed.username &&
        !parsed.password
      );
    } catch {
      return false;
    }
  }, "Endpoint URL must use HTTP or HTTPS and must not include credentials");

export const createEndpointSchema = z.object({
  endpoint: endpointUrlSchema,
  eventTypes: z
    .array(z.string().min(1))
    .min(1, "At least one event type is required"),
});
